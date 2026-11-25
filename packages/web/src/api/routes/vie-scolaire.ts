import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  attendanceRecords,
  attendanceSessions,
  classes,
  disciplineIncidents,
  guardians,
  staff,
  studentGuardians,
  students,
  timetableEntries,
} from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { createNotifications, familyUserIdsForStudents } from "./notifications";
import { logStudentHistory, tenantOf } from "./scolarite-helpers";

const ATTENDANCE_STATUSES = [
  "Présent",
  "Absent",
  "Retard",
  "Absence justifiée",
  "Dispensé",
] as const;
const attendanceStatusField = z.enum(ATTENDANCE_STATUSES);

const INCIDENT_TYPES = ["Observation", "Avertissement", "Sanction", "Incident"] as const;
const incidentTypeField = z.enum(INCIDENT_TYPES);
const SEVERITIES = ["Faible", "Moyenne", "Élevée"] as const;
const severityField = z.enum(SEVERITIES);
const INCIDENT_STATUSES = ["Ouvert", "En cours", "Résolu", "Archivé"] as const;
const incidentStatusField = z.enum(INCIDENT_STATUSES);

const ATTENDANCE_ROLES = [
  "direction",
  "administration",
  "supervisor",
  "teacher",
  "parent",
  "student",
] as const;
const ATTENDANCE_WRITE_ROLES = ["direction", "administration", "supervisor", "teacher"] as const;
const DISCIPLINE_ROLES = ["direction", "administration", "supervisor", "teacher"] as const;
const DISCIPLINE_WRITE_ROLES = ["direction", "administration", "supervisor", "teacher"] as const;

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");

function activeStudent(status: string) {
  return !["Archivé", "Transféré", "Sorti", "Désinscrit"].includes(status);
}

async function teacherClassIds(establishmentId: string, userId: string) {
  const staffRows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.establishmentId, establishmentId), eq(staff.userId, userId)))
    .limit(1);
  const person = staffRows[0];
  if (!person) return [] as string[];
  const classRows = await db
    .select()
    .from(classes)
    .where(eq(classes.establishmentId, establishmentId));
  const byAssignment = classRows
    .filter((row) => person.assignments.includes(row.name))
    .map((row) => row.id);
  const byTimetable = (
    await db
      .select({ classId: timetableEntries.classId })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.establishmentId, establishmentId),
          eq(timetableEntries.staffId, person.id),
        ),
      )
  ).map((row) => row.classId);
  return [...new Set([...byAssignment, ...byTimetable])];
}

async function familyStudentIds(establishmentId: string, userId: string, role: string) {
  if (role === "student") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(eq(students.establishmentId, establishmentId), eq(students.userId, userId)),
      );
    return rows.map((row) => row.id);
  }
  const linkedGuardians = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(
      and(eq(guardians.establishmentId, establishmentId), eq(guardians.userId, userId)),
    );
  if (!linkedGuardians.length) return [] as string[];
  const links = await db
    .select({ studentId: studentGuardians.studentId })
    .from(studentGuardians)
    .where(
      inArray(
        studentGuardians.guardianId,
        linkedGuardians.map((row) => row.id),
      ),
    );
  return links.map((row) => row.studentId);
}

async function visibleClassRows(
  establishmentId: string,
  userId: string,
  role: string,
) {
  const rows = await db
    .select()
    .from(classes)
    .where(eq(classes.establishmentId, establishmentId))
    .orderBy(asc(classes.name));
  if (role === "teacher") {
    const allowed = new Set(await teacherClassIds(establishmentId, userId));
    return rows.filter((row) => allowed.has(row.id));
  }
  return rows;
}

async function assertAttendanceClass(
  establishmentId: string,
  userId: string,
  role: string,
  classId: string,
) {
  const rows = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Classe inconnue." });
  if (role === "teacher") {
    const allowed = await teacherClassIds(establishmentId, userId);
    if (!allowed.includes(classId)) {
      throw new ORPCError("FORBIDDEN", {
        message: "Vous ne pouvez faire l’appel que pour vos classes assignées.",
      });
    }
  }
  return rows[0];
}

const attendanceInput = z.object({
  classId: z.string().trim().max(60).optional(),
  date: dateField.optional(),
});

const attendanceRecordInput = z.object({
  studentId: z.string().trim().min(1).max(60),
  status: attendanceStatusField,
  minutesLate: z.number().int().min(0).max(600).default(0),
  reason: z.string().trim().max(300).default(""),
  justification: z.string().trim().max(500).default(""),
});

const saveAttendanceInput = z.object({
  classId: z.string().trim().min(1).max(60),
  date: dateField,
  validate: z.boolean().default(false),
  note: z.string().trim().max(500).default(""),
  records: z.array(attendanceRecordInput).min(1).max(500),
});

const incidentInput = z.object({
  studentId: z.string().trim().min(1).max(60),
  date: dateField,
  type: incidentTypeField.default("Observation"),
  severity: severityField.default("Moyenne"),
  description: z.string().trim().min(2).max(1000),
  location: z.string().trim().max(120).default(""),
  responsibleStaffId: z.string().trim().max(60).optional(),
  measures: z.string().trim().max(1000).default(""),
  status: incidentStatusField.default("Ouvert"),
});

const updateIncidentInput = z.object({
  id: z.string().trim().min(1).max(60),
  status: incidentStatusField,
  measures: z.string().trim().max(1000).optional(),
});

export const vieScolaire = {
  /** Feuille d'appel d'une classe et d'une date, filtrée selon le rôle. */
  attendanceSnapshot: authed.input(attendanceInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...ATTENDANCE_ROLES]);
    const establishmentId = tenantOf(context);
    const role = context.user.role;
    const date = input.date || new Date().toISOString().slice(0, 10);
    const family = role === "parent" || role === "student";
    const linkedIds = family
      ? await familyStudentIds(establishmentId, context.user.id, role)
      : [];
    let classRows = await visibleClassRows(establishmentId, context.user.id, role);
    if (family) {
      const studentRows = linkedIds.length
        ? await db
            .select({ classId: students.classId })
            .from(students)
            .where(
              and(
                eq(students.establishmentId, establishmentId),
                inArray(students.id, linkedIds),
              ),
            )
        : [];
      const classIds = new Set(
        studentRows.map((row) => row.classId).filter((id): id is string => Boolean(id)),
      );
      classRows = classRows.filter((row) => classIds.has(row.id));
    }
    if (input.classId && !classRows.some((row) => row.id === input.classId)) {
      throw new ORPCError("FORBIDDEN", { message: "Classe non accessible." });
    }
    const selected = input.classId
      ? classRows.find((row) => row.id === input.classId) ?? null
      : classRows[0] ?? null;
    if (!selected) {
      return {
        classes: classRows.map((row) => ({ id: row.id, name: row.name })),
        classId: "",
        className: "",
        date,
        session: null,
        students: [],
        stats: { present: 0, absent: 0, late: 0, justified: 0, excused: 0, unrecorded: 0 },
        recent: [],
      };
    }

    const roster = (
      await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.establishmentId, establishmentId),
            eq(students.classId, selected.id),
          ),
        )
        .orderBy(asc(students.lastName), asc(students.firstName))
    ).filter((student) => activeStudent(student.status) && (!family || linkedIds.includes(student.id)));

    const sessionRows = await db
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.establishmentId, establishmentId),
          eq(attendanceSessions.classId, selected.id),
          eq(attendanceSessions.date, date),
          ...(family ? [eq(attendanceSessions.status, "Validé")] : []),
        ),
      )
      .orderBy(desc(attendanceSessions.createdAt))
      .limit(1);
    const session = sessionRows[0] ?? null;
    const records = session
      ? await db
          .select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.establishmentId, establishmentId),
              eq(attendanceRecords.sessionId, session.id),
            ),
          )
      : [];
    const recordByStudent = new Map(records.map((record) => [record.studentId, record]));
    const mappedStudents = roster.map((student) => {
      const record = recordByStudent.get(student.id);
      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        reference: student.reference,
        status: record?.status ?? "",
        minutesLate: record?.minutesLate ?? 0,
        reason: record?.reason ?? "",
        justification: record?.justification ?? "",
      };
    });
    const count = (status: string) =>
      mappedStudents.filter((student) => student.status === status).length;
    const recent = family
      ? []
      : (
          await db
            .select({
              id: attendanceSessions.id,
              classId: attendanceSessions.classId,
              date: attendanceSessions.date,
              status: attendanceSessions.status,
              takenByName: attendanceSessions.takenByName,
              className: classes.name,
            })
            .from(attendanceSessions)
            .innerJoin(classes, eq(classes.id, attendanceSessions.classId))
            .where(eq(attendanceSessions.establishmentId, establishmentId))
            .orderBy(desc(attendanceSessions.date), desc(attendanceSessions.createdAt))
            .limit(8)
        )
          .filter(
            (row) =>
              role !== "teacher" || classRows.some((item) => item.id === row.classId),
          )
          .map((row) => ({
            id: row.id,
            date: row.date,
            status: row.status,
            takenByName: row.takenByName,
            className: row.className,
          }));

    return {
      classes: classRows.map((row) => ({ id: row.id, name: row.name })),
      classId: selected.id,
      className: selected.name,
      date,
      session: session
        ? {
            id: session.id,
            status: session.status,
            takenByName: session.takenByName,
            note: session.note,
            createdAt: new Date(session.createdAt).toISOString(),
          }
        : null,
      students: mappedStudents,
      stats: {
        present: count("Présent"),
        absent: count("Absent"),
        late: count("Retard"),
        justified: count("Absence justifiée"),
        excused: count("Dispensé"),
        unrecorded: mappedStudents.filter((student) => !student.status).length,
      },
      recent,
    };
  }),

  /** Enregistre ou valide l'appel complet d'une classe. */
  saveAttendance: authed.input(saveAttendanceInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...ATTENDANCE_WRITE_ROLES]);
    const establishmentId = tenantOf(context);
    const classRow = await assertAttendanceClass(
      establishmentId,
      context.user.id,
      context.user.role,
      input.classId,
    );
    const roster = (
      await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.establishmentId, establishmentId),
            eq(students.classId, classRow.id),
          ),
        )
    ).filter((student) => activeStudent(student.status));
    const rosterIds = new Set(roster.map((student) => student.id));
    const providedIds = new Set(input.records.map((record) => record.studentId));
    for (const id of providedIds) {
      if (!rosterIds.has(id)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Un élève transmis n’appartient pas à cette classe.",
        });
      }
    }
    if (input.validate) {
      const missing = roster.filter((student) => !providedIds.has(student.id));
      if (missing.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: `${missing.length} élève(s) doivent avoir un statut avant validation.`,
        });
      }
    }

    const sessionRows = await db
      .select()
      .from(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.establishmentId, establishmentId),
          eq(attendanceSessions.classId, classRow.id),
          eq(attendanceSessions.date, input.date),
        ),
      )
      .orderBy(desc(attendanceSessions.createdAt))
      .limit(1);
    let session = sessionRows[0];
    const wasValidated = session?.status === "Validé";
    if (session?.status === "Validé") {
      if (context.user.role === "teacher" || context.user.role === "supervisor") {
        throw new ORPCError("FORBIDDEN", {
          message: "Un appel validé ne peut être corrigé que par la direction ou l’administration.",
        });
      }
    }
    const sessionId = session?.id ?? crypto.randomUUID();
    const nextStatus = input.validate ? "Validé" : "Brouillon";
    if (session) {
      await db
        .update(attendanceSessions)
        .set({
          status: nextStatus,
          takenByUserId: context.user.id,
          takenByName: context.user.name,
          note: input.note,
        })
        .where(eq(attendanceSessions.id, session.id));
    } else {
      await db.insert(attendanceSessions).values({
        id: sessionId,
        establishmentId,
        classId: classRow.id,
        date: input.date,
        takenByUserId: context.user.id,
        takenByName: context.user.name,
        status: nextStatus,
        note: input.note,
      });
    }
    const existing = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId));
    const existingByStudent = new Map(existing.map((record) => [record.studentId, record]));
    const now = new Date().toISOString();
    for (const record of input.records) {
      const current = existingByStudent.get(record.studentId);
      if (current) {
        await db
          .update(attendanceRecords)
          .set({
            status: record.status,
            minutesLate: record.minutesLate,
            reason: record.reason,
            justification: record.justification,
            updatedAt: now,
          })
          .where(eq(attendanceRecords.id, current.id));
      } else {
        await db.insert(attendanceRecords).values({
          id: crypto.randomUUID(),
          establishmentId,
          sessionId,
          studentId: record.studentId,
          status: record.status,
          minutesLate: record.minutesLate,
          reason: record.reason,
          justification: record.justification,
          updatedAt: now,
        });
      }
    }

    if (input.validate) {
      const byId = new Map(roster.map((student) => [student.id, student]));
      for (const record of input.records) {
        if (record.status === "Présent") continue;
        const student = byId.get(record.studentId);
        if (!student) continue;
        await logStudentHistory(
          establishmentId,
          student.id,
          "Vie scolaire",
          `${record.status} le ${input.date}${record.reason ? ` · ${record.reason}` : ""}`,
          context.user.name,
        );
      }
      // Notifications automatiques aux familles lors de la première validation de l'appel.
      if (!wasValidated) {
        for (const record of input.records) {
          if (record.status !== "Absent") continue;
          const student = byId.get(record.studentId);
          if (!student) continue;
          const userIds = await familyUserIdsForStudents(establishmentId, [student.id]);
          await createNotifications({
            establishmentId,
            userIds,
            title: "Absence signalée",
            body: `${student.firstName} ${student.lastName} a été absent(e) le ${input.date}${
              record.reason ? ` · ${record.reason}` : ""
            }.`,
            category: "Vie scolaire",
            link: "attendance",
          });
          const absenceRows = await db
            .select({ id: attendanceRecords.id })
            .from(attendanceRecords)
            .where(
              and(
                eq(attendanceRecords.establishmentId, establishmentId),
                eq(attendanceRecords.studentId, student.id),
                eq(attendanceRecords.status, "Absent"),
              ),
            );
          const total = absenceRows.length;
          if (total >= 3 && total % 3 === 0) {
            await createNotifications({
              establishmentId,
              userIds,
              title: "Absences répétées",
              body: `${student.firstName} ${student.lastName} cumule ${total} absences non justifiées.`,
              category: "Vie scolaire",
              link: "attendance",
            });
          }
        }
      }
    }
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: input.validate ? "Validation de l’appel" : "Enregistrement de l’appel",
      target: `${classRow.name} · ${input.date}`,
      detail: `${input.records.length} élève(s)`,
    });
    return { sessionId, status: nextStatus, count: input.records.length };
  }),

  /** Incidents et suivi éducatif visibles par le personnel habilité. */
  disciplineSnapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...DISCIPLINE_ROLES]);
    const establishmentId = tenantOf(context);
    const [classRows, studentRows, staffRows] = await Promise.all([
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
      db
        .select()
        .from(students)
        .where(eq(students.establishmentId, establishmentId))
        .orderBy(asc(students.lastName), asc(students.firstName)),
      db
        .select()
        .from(staff)
        .where(
          and(eq(staff.establishmentId, establishmentId), eq(staff.status, "Actif")),
        ),
    ]);
    const classById = new Map(classRows.map((row) => [row.id, row]));
    const studentById = new Map(studentRows.map((row) => [row.id, row]));
    const allowedClassIds =
      context.user.role === "teacher"
        ? new Set(await teacherClassIds(establishmentId, context.user.id))
        : null;
    const incidents = (
      await db
        .select()
        .from(disciplineIncidents)
        .where(eq(disciplineIncidents.establishmentId, establishmentId))
        .orderBy(desc(disciplineIncidents.date), desc(disciplineIncidents.createdAt))
    )
      .filter((incident) => {
        if (!allowedClassIds) return true;
        const student = studentById.get(incident.studentId);
        return Boolean(student?.classId && allowedClassIds.has(student.classId));
      })
      .map((incident) => {
        const student = studentById.get(incident.studentId);
        return {
          id: incident.id,
          studentId: incident.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "",
          className: student?.classId ? classById.get(student.classId)?.name ?? "" : "",
          date: incident.date,
          type: incident.type,
          severity: incident.severity,
          description: incident.description,
          location: incident.location,
          responsibleName: incident.responsibleName,
          measures: incident.measures,
          status: incident.status,
          createdByName: incident.createdByName,
          createdAt: new Date(incident.createdAt).toISOString(),
        };
      });

    return {
      incidents,
      classes: classRows
        .filter((row) => !allowedClassIds || allowedClassIds.has(row.id))
        .map((row) => ({ id: row.id, name: row.name })),
      students: studentRows
        .filter((student) => activeStudent(student.status))
        .filter((student) => !allowedClassIds || (student.classId && allowedClassIds.has(student.classId)))
        .map((student) => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          className: student.classId ? classById.get(student.classId)?.name ?? "" : "",
        })),
      staff: staffRows.map((person) => ({
        id: person.id,
        name: person.name,
        type: person.type,
      })),
      stats: {
        open: incidents.filter((incident) => incident.status === "Ouvert").length,
        ongoing: incidents.filter((incident) => incident.status === "En cours").length,
        resolved: incidents.filter((incident) => incident.status === "Résolu").length,
        total: incidents.length,
      },
    };
  }),

  createIncident: authed.input(incidentInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...DISCIPLINE_WRITE_ROLES]);
    const establishmentId = tenantOf(context);
    const studentRows = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, input.studentId),
          eq(students.establishmentId, establishmentId),
        ),
      )
      .limit(1);
    const student = studentRows[0];
    if (!student) throw new ORPCError("BAD_REQUEST", { message: "Élève inconnu." });
    if (context.user.role === "teacher") {
      const allowed = await teacherClassIds(establishmentId, context.user.id);
      if (!student.classId || !allowed.includes(student.classId)) {
        throw new ORPCError("FORBIDDEN", {
          message: "Vous ne pouvez consigner un incident que pour vos classes.",
        });
      }
      if (input.type !== "Observation") {
        throw new ORPCError("FORBIDDEN", {
          message: "Un enseignant peut consigner une observation, pas une sanction.",
        });
      }
    }
    let responsibleName = context.user.name;
    if (input.responsibleStaffId) {
      const staffRows = await db
        .select({ name: staff.name })
        .from(staff)
        .where(
          and(
            eq(staff.id, input.responsibleStaffId),
            eq(staff.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      if (!staffRows.length) {
        throw new ORPCError("BAD_REQUEST", { message: "Responsable inconnu." });
      }
      responsibleName = staffRows[0].name;
    }
    const id = crypto.randomUUID();
    await db.insert(disciplineIncidents).values({
      id,
      establishmentId,
      studentId: student.id,
      date: input.date,
      type: input.type,
      severity: input.severity,
      description: input.description,
      location: input.location,
      responsibleStaffId: input.responsibleStaffId || null,
      responsibleName,
      measures: input.measures,
      status: input.status,
      createdByUserId: context.user.id,
      createdByName: context.user.name,
      updatedAt: new Date().toISOString(),
    });
    await logStudentHistory(
      establishmentId,
      student.id,
      "Vie scolaire",
      `${input.type} · ${input.description}`,
      context.user.name,
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’un suivi éducatif",
      target: `${student.firstName} ${student.lastName}`,
      detail: input.type,
    });
    return { id };
  }),

  updateIncident: authed.input(updateIncidentInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...DISCIPLINE_WRITE_ROLES]);
    const establishmentId = tenantOf(context);
    const rows = await db
      .select()
      .from(disciplineIncidents)
      .where(
        and(
          eq(disciplineIncidents.id, input.id),
          eq(disciplineIncidents.establishmentId, establishmentId),
        ),
      )
      .limit(1);
    const incident = rows[0];
    if (!incident) throw new ORPCError("BAD_REQUEST", { message: "Suivi inconnu." });
    if (context.user.role === "teacher") {
      const allowed = await teacherClassIds(establishmentId, context.user.id);
      const studentRows = await db
        .select({ classId: students.classId })
        .from(students)
        .where(eq(students.id, incident.studentId))
        .limit(1);
      const classId = studentRows[0]?.classId;
      if (!classId || !allowed.includes(classId)) {
        throw new ORPCError("FORBIDDEN", {
          message: "Vous ne pouvez modifier que les suivis de vos classes.",
        });
      }
    }
    await db
      .update(disciplineIncidents)
      .set({
        status: input.status,
        measures: input.measures ?? incident.measures,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(disciplineIncidents.id, incident.id));
    await logStudentHistory(
      establishmentId,
      incident.studentId,
      "Vie scolaire",
      `Suivi ${input.status}`,
      context.user.name,
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Mise à jour d’un suivi éducatif",
      target: incident.id,
      detail: input.status,
    });
    return { id: incident.id, status: input.status };
  }),
};

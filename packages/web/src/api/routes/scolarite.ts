import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  academicYears,
  classes,
  enrollments,
  guardians,
  staff,
  studentDocuments,
  studentGuardians,
  studentHistory,
  students,
  timetableEntries,
} from "../database/schema";
import { authed, MANAGE_ROLES, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import {
  logStudentHistory,
  studentStatusField,
  tenantOf,
} from "./scolarite-helpers";

const statusField = z.string().trim().min(1).max(40);

const classInput = z.object({
  name: z.string().trim().min(1).max(60),
  level: z.string().trim().max(60).default(""),
  room: z.string().trim().max(60).default(""),
  capacity: z.number().int().min(1).max(200).default(30),
  mainTeacher: z.string().trim().max(120).default(""),
  status: statusField.default("Actif"),
});

const staffInput = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.string().trim().min(2).max(40).default("Enseignant"),
  specialty: z.string().trim().max(80).default(""),
  assignments: z.string().trim().max(160).default(""),
  weeklyHours: z.number().int().min(0).max(60).default(0),
  email: z.string().trim().toLowerCase().email().max(190).or(z.literal("")).default(""),
  status: statusField.default("Actif"),
});

const studentInput = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  reference: z.string().trim().max(40).optional(),
  classId: z.string().trim().max(60).optional(),
  birthDate: z.string().trim().max(20).default(""),
  sex: z.string().trim().max(20).default(""),
  address: z.string().trim().max(240).default(""),
  phone: z.string().trim().max(40).default(""),
  schoolYear: z.string().trim().max(20).default(""),
  photo: z.string().trim().max(190).default(""),
  birthCertificate: z.string().trim().max(190).default(""),
  transferCertificate: z.string().trim().max(190).default(""),
  enrolledAt: z.string().trim().max(20).default(""),
  guardianName: z.string().trim().max(120).optional(),
  guardianEmail: z.string().trim().toLowerCase().email().max(190).or(z.literal("")).optional(),
  guardianPhone: z.string().trim().max(40).optional(),
  guardianAddress: z.string().trim().max(240).optional(),
  guardianRelation: z.string().trim().max(40).optional(),
  status: studentStatusField.default("En attente de validation"),
});

const guardianInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(190).or(z.literal("")).default(""),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(240).default(""),
  studentIds: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  status: statusField.default("Actif"),
});

function tenantOf(context: { user: { establishmentId: string | null }; establishment: unknown }) {
  const id = context.user.establishmentId;
  if (!id) throw new ORPCError("BAD_REQUEST", { message: "Aucun établissement associé." });
  return id;
}

async function ensureStudentIds(establishmentId: string, ids: string[]) {
  if (!ids.length) return [];
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.establishmentId, establishmentId));
  const known = new Set(rows.map((r) => r.id));
  return ids.filter((id) => known.has(id));
}

/** Vérifie que la classe appartient à l'établissement et qu'il reste de la place. */
async function assertClassAvailable(
  establishmentId: string,
  classId: string,
  exceptStudentId?: string,
) {
  const rows = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.establishmentId, establishmentId)))
    .limit(1);
  const found = rows[0];
  if (!found) throw new ORPCError("BAD_REQUEST", { message: "Classe inconnue." });
  const enrolled = await db
    .select({ id: students.id })
    .from(students)
    .where(
      exceptStudentId
        ? and(eq(students.classId, classId), ne(students.id, exceptStudentId))
        : eq(students.classId, classId),
    );
  if (enrolled.length >= found.capacity) {
    throw new ORPCError("BAD_REQUEST", {
      message: `La classe ${found.name} est complète (${found.capacity} places).`,
    });
  }
  return found;
}

/** Refuse un doublon nom + prénom + date de naissance dans le même établissement. */
async function assertNoDuplicate(
  establishmentId: string,
  firstName: string,
  lastName: string,
  birthDate: string,
  exceptStudentId?: string,
) {
  if (!birthDate) return;
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.establishmentId, establishmentId),
        eq(students.firstName, firstName),
        eq(students.lastName, lastName),
        eq(students.birthDate, birthDate),
      ),
    );
  const duplicate = rows.find((r) => r.id !== exceptStudentId);
  if (duplicate) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Un élève avec le même nom, prénom et date de naissance existe déjà.",
    });
  }
}

async function findStudentOf(establishmentId: string, studentId: string) {
  const rows = await db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Dossier élève inconnu." });
  return rows[0];
}

/** Retrouve l'année scolaire par libellé, sinon l'année active. */
async function resolveAcademicYearId(establishmentId: string, label: string) {
  const rows = await db
    .select({ id: academicYears.id, label: academicYears.label, status: academicYears.status })
    .from(academicYears)
    .where(eq(academicYears.establishmentId, establishmentId));
  return (
    rows.find((y) => label && y.label === label)?.id ??
    rows.find((y) => y.status === "Active")?.id ??
    rows[0]?.id ??
    null
  );
}

async function addEnrollment(entry: {
  establishmentId: string;
  studentId: string;
  academicYearId?: string | null;
  schoolYear: string;
  classId?: string | null;
  enrolledAt?: string;
  kind: string;
  status: string;
  note?: string;
}) {
  const academicYearId =
    entry.academicYearId ??
    (await resolveAcademicYearId(entry.establishmentId, entry.schoolYear));
  await db.insert(enrollments).values({
    id: crypto.randomUUID(),
    establishmentId: entry.establishmentId,
    studentId: entry.studentId,
    academicYearId,
    schoolYear: entry.schoolYear,
    classId: entry.classId ?? null,
    enrolledAt: entry.enrolledAt || new Date().toISOString().slice(0, 10),
    kind: entry.kind,
    status: entry.status,
    note: entry.note ?? "",
  });
}

export const scolarite = {
  /** Photographie des dossiers visibles pour l'utilisateur connecté. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) {
      return {
        students: [],
        guardians: [],
        classes: [],
        staff: [],
        scope: "platform" as const,
      };
    }
    const [classRows, staffRows, studentRows, guardianRows, linkRows, historyRows, documentRows, enrollmentRows] =
      await Promise.all([
      db
        .select()
        .from(classes)
        .where(eq(classes.establishmentId, establishmentId))
        .orderBy(asc(classes.name)),
      db
        .select()
        .from(staff)
        .where(eq(staff.establishmentId, establishmentId))
        .orderBy(asc(staff.name)),
      db
        .select()
        .from(students)
        .where(eq(students.establishmentId, establishmentId))
        .orderBy(asc(students.lastName), asc(students.firstName)),
      db
        .select()
        .from(guardians)
        .where(eq(guardians.establishmentId, establishmentId))
        .orderBy(asc(guardians.name)),
      db
        .select({
          studentId: studentGuardians.studentId,
          guardianId: studentGuardians.guardianId,
          relation: studentGuardians.relation,
        })
        .from(studentGuardians)
        .innerJoin(students, eq(students.id, studentGuardians.studentId))
        .where(eq(students.establishmentId, establishmentId)),
      db
        .select()
        .from(studentHistory)
        .where(eq(studentHistory.establishmentId, establishmentId))
        .orderBy(desc(studentHistory.createdAt)),
      db
        .select({
          id: studentDocuments.id,
          studentId: studentDocuments.studentId,
          kind: studentDocuments.kind,
          fileName: studentDocuments.fileName,
          mimeType: studentDocuments.mimeType,
          size: studentDocuments.size,
          uploadedBy: studentDocuments.uploadedBy,
          createdAt: studentDocuments.createdAt,
        })
        .from(studentDocuments)
        .where(eq(studentDocuments.establishmentId, establishmentId))
        .orderBy(desc(studentDocuments.createdAt)),
      db
        .select()
        .from(enrollments)
        .where(eq(enrollments.establishmentId, establishmentId))
        .orderBy(desc(enrollments.createdAt)),
    ]);

    const historyByStudent = new Map<string, typeof historyRows>();
    for (const event of historyRows) {
      const list = historyByStudent.get(event.studentId) ?? [];
      list.push(event);
      historyByStudent.set(event.studentId, list);
    }
    const documentsByStudent = new Map<string, typeof documentRows>();
    for (const doc of documentRows) {
      const list = documentsByStudent.get(doc.studentId) ?? [];
      list.push(doc);
      documentsByStudent.set(doc.studentId, list);
    }
    const enrollmentsByStudent = new Map<string, typeof enrollmentRows>();
    for (const enrollment of enrollmentRows) {
      const list = enrollmentsByStudent.get(enrollment.studentId) ?? [];
      list.push(enrollment);
      enrollmentsByStudent.set(enrollment.studentId, list);
    }

    const classById = new Map(classRows.map((c) => [c.id, c]));
    const studentNameById = new Map(
      studentRows.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()]),
    );
    const guardianNameById = new Map(guardianRows.map((g) => [g.id, g.name]));
    const guardianNamesByStudent = new Map<string, string[]>();
    const childrenByGuardian = new Map<string, string[]>();
    const guardianDetailsByStudent = new Map<
      string,
      {
        guardianId: string;
        name: string;
        phone: string;
        email: string;
        address: string;
        relation: string;
      }[]
    >();
    for (const link of linkRows) {
      const guardianName = guardianNameById.get(link.guardianId);
      const studentName = studentNameById.get(link.studentId);
      if (guardianName) {
        const list = guardianNamesByStudent.get(link.studentId) ?? [];
        list.push(guardianName);
        guardianNamesByStudent.set(link.studentId, list);
        const guardian = guardianRows.find((g) => g.id === link.guardianId);
        if (guardian) {
          const details = guardianDetailsByStudent.get(link.studentId) ?? [];
          details.push({
            guardianId: guardian.id,
            name: guardian.name,
            phone: guardian.phone,
            email: guardian.email,
            address: guardian.address,
            relation: link.relation,
          });
          guardianDetailsByStudent.set(link.studentId, details);
        }
      }
      if (studentName) {
        const list = childrenByGuardian.get(link.guardianId) ?? [];
        list.push(studentName);
        childrenByGuardian.set(link.guardianId, list);
      }
    }

    const classViews = classRows.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      room: c.room,
      capacity: c.capacity,
      enrolled: studentRows.filter((s) => s.classId === c.id).length,
      mainTeacher: c.mainTeacher,
      status: c.status,
    }));
    const studentViews = studentRows.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: `${s.firstName} ${s.lastName}`.trim(),
      reference: s.reference,
      classId: s.classId,
      className: s.classId ? classById.get(s.classId)?.name ?? "" : "",
      guardians: guardianNamesByStudent.get(s.id) ?? [],
      guardianDetails: guardianDetailsByStudent.get(s.id) ?? [],
      guardianRelations: linkRows
        .filter((l) => l.studentId === s.id)
        .map((l) => l.relation)
        .filter(Boolean),
      birthDate: s.birthDate,
      sex: s.sex,
      address: s.address,
      phone: s.phone,
      schoolYear: s.schoolYear,
      photo: s.photo,
      birthCertificate: s.birthCertificate,
      transferCertificate: s.transferCertificate,
      enrolledAt: s.enrolledAt,
      status: s.status,
      admissionDecision: s.admissionDecision,
      admissionNote: s.admissionNote,
      archivedAt: s.archivedAt,
      history: (historyByStudent.get(s.id) ?? []).map((h) => ({
        id: h.id,
        action: h.action,
        detail: h.detail,
        actor: h.actor,
        createdAt: h.createdAt,
      })),
      enrollments: (enrollmentsByStudent.get(s.id) ?? []).map((e) => ({
        id: e.id,
        academicYearId: e.academicYearId,
        schoolYear: e.schoolYear,
        classId: e.classId,
        className: e.classId ? classById.get(e.classId)?.name ?? "" : "",
        enrolledAt: e.enrolledAt,
        kind: e.kind,
        status: e.status,
        note: e.note,
        createdAt: e.createdAt,
      })),
      documents: (documentsByStudent.get(s.id) ?? []).map((d) => ({
        id: d.id,
        kind: d.kind,
        fileName: d.fileName,
        mimeType: d.mimeType,
        size: d.size,
        uploadedBy: d.uploadedBy,
        createdAt: d.createdAt,
      })),
    }));
    const guardianViews = guardianRows.map((g) => ({
      id: g.id,
      userId: g.userId,
      name: g.name,
      email: g.email,
      phone: g.phone,
      address: g.address,
      children: childrenByGuardian.get(g.id) ?? [],
      portal: g.userId ? "Invitation acceptée" : "Invitation envoyée",
      status: g.status,
    }));
    const staffViews = staffRows.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      type: s.type,
      specialty: s.specialty,
      assignments: s.assignments,
      weeklyHours: s.weeklyHours,
      email: s.email,
      status: s.status,
    }));

    let visibleStudents = studentViews;
    let visibleClasses = classViews;
    let visibleGuardians = guardianViews;
    let visibleStaff = staffViews;

    if (context.user.role === "student") {
      visibleStudents = studentViews.filter((s) => s.userId === context.user.id);
    } else if (context.user.role === "parent") {
      const myGuardianIds = new Set(
        guardianRows.filter((g) => g.userId === context.user.id).map((g) => g.id),
      );
      const childIds = new Set(
        linkRows.filter((l) => myGuardianIds.has(l.guardianId)).map((l) => l.studentId),
      );
      visibleStudents = studentViews.filter((s) => childIds.has(s.id));
      visibleGuardians = guardianViews.filter((g) => myGuardianIds.has(g.id));
    } else if (context.user.role === "teacher") {
      const me = staffRows.find((s) => s.userId === context.user.id);
      const assigned = (me?.assignments ?? "")
        .split(/[·,;]/)
        .map((v) => v.trim())
        .filter(Boolean);
      if (assigned.length) {
        visibleClasses = classViews.filter((c) => assigned.includes(c.name));
        const classIds = new Set(visibleClasses.map((c) => c.id));
        visibleStudents = studentViews.filter((s) => s.classId && classIds.has(s.classId));
      }
    }

    if (context.user.role === "teacher" || context.user.role === "supervisor") {
      const studentIds = new Set(visibleStudents.map((s) => s.id));
      const guardianIds = new Set(
        linkRows.filter((l) => studentIds.has(l.studentId)).map((l) => l.guardianId),
      );
      visibleGuardians = guardianViews.filter((g) => guardianIds.has(g.id));
    }

    return {
      students: visibleStudents,
      guardians: visibleGuardians,
      classes:
        context.user.role === "student" || context.user.role === "parent"
          ? classViews.filter((c) => visibleStudents.some((s) => s.classId === c.id))
          : visibleClasses,
      staff: context.user.role === "parent" || context.user.role === "student" ? [] : visibleStaff,
      scope: "establishment" as const,
    };
  }),

  createClass: authed.input(classInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const id = crypto.randomUUID();
    await db.insert(classes).values({
      id,
      establishmentId: tenantOf(context),
      name: input.name,
      level: input.level,
      room: input.room,
      capacity: input.capacity,
      mainTeacher: input.mainTeacher,
      status: input.status,
    });
    return { id };
  }),

  createStaff: authed.input(staffInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const id = crypto.randomUUID();
    await db.insert(staff).values({
      id,
      establishmentId: tenantOf(context),
      name: input.name,
      type: input.type,
      specialty: input.specialty,
      assignments: input.assignments,
      weeklyHours: input.weeklyHours,
      email: input.email,
      status: input.status,
    });
    return { id };
  }),

  updateStaff: authed
    .input(staffInput.extend({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const { id, ...values } = input;
      const [existing] = await db
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.id, id), eq(staff.establishmentId, establishmentId)))
        .limit(1);
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Collaborateur introuvable." });
      }
      await db
        .update(staff)
        .set({
          name: values.name,
          type: values.type,
          specialty: values.specialty,
          assignments: values.assignments,
          weeklyHours: values.weeklyHours,
          email: values.email,
          status: values.status,
        })
        .where(and(eq(staff.id, id), eq(staff.establishmentId, establishmentId)));
      return { id };
    }),

  deleteStaff: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const [existing] = await db
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.id, input.id), eq(staff.establishmentId, establishmentId)))
        .limit(1);
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Collaborateur introuvable." });
      }
      const [assigned] = await db
        .select({ id: timetableEntries.id })
        .from(timetableEntries)
        .where(
          and(
            eq(timetableEntries.staffId, input.id),
            eq(timetableEntries.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      if (assigned) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Ce collaborateur est affecté à des cours : réaffectez-les avant de le retirer.",
        });
      }
      await db
        .delete(staff)
        .where(and(eq(staff.id, input.id), eq(staff.establishmentId, establishmentId)));
      return { id: input.id };
    }),

  createStudent: authed.input(studentInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    let classId: string | null = null;
    if (input.classId) {
      const found = await assertClassAvailable(establishmentId, input.classId);
      classId = found.id;
    }
    await assertNoDuplicate(
      establishmentId,
      input.firstName,
      input.lastName,
      input.birthDate,
    );
    const studentId = crypto.randomUUID();
    const reference = input.reference?.trim() || (await nextReference(establishmentId));
    const enrolledAt = input.enrolledAt || new Date().toISOString().slice(0, 10);
    await db.insert(students).values({
      id: studentId,
      establishmentId,
      firstName: input.firstName,
      lastName: input.lastName,
      reference,
      classId,
      birthDate: input.birthDate,
      sex: input.sex,
      address: input.address,
      phone: input.phone,
      schoolYear: input.schoolYear,
      photo: input.photo,
      birthCertificate: input.birthCertificate,
      transferCertificate: input.transferCertificate,
      enrolledAt,
      status: input.status,
    });
    await logStudentHistory(
      establishmentId,
      studentId,
      "Création du dossier",
      input.schoolYear ? `Inscription · ${input.schoolYear}` : "Inscription",
      context.user.name,
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’un dossier élève",
      target: reference,
      detail: `${input.firstName} ${input.lastName}`,
    });
    if (input.guardianName) {
      const existing = await db
        .select()
        .from(guardians)
        .where(eq(guardians.establishmentId, establishmentId));
      const match =
        (input.guardianEmail
          ? existing.find((g) => g.email && g.email === input.guardianEmail)
          : undefined) ?? existing.find((g) => g.name === input.guardianName);
      const guardianId = match?.id ?? crypto.randomUUID();
      if (!match) {
        await db.insert(guardians).values({
          id: guardianId,
          establishmentId,
          name: input.guardianName,
          email: input.guardianEmail ?? "",
          phone: input.guardianPhone ?? "",
          address: input.guardianAddress ?? "",
        });
      }
      await db
        .insert(studentGuardians)
        .values({
          studentId,
          guardianId,
          relation: input.guardianRelation || "Responsable légal",
        });
    }
    await addEnrollment({
      establishmentId,
      studentId,
      schoolYear: input.schoolYear,
      classId,
      enrolledAt,
      kind: "inscription",
      status: input.status,
      note: "Création du dossier",
    });
    return { id: studentId, reference };
  }),

  updateStudent: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        firstName: z.string().trim().min(1).max(80).optional(),
        lastName: z.string().trim().min(1).max(80).optional(),
        classId: z.string().trim().max(60).optional(),
        birthDate: z.string().trim().max(20).optional(),
        sex: z.string().trim().max(20).optional(),
        address: z.string().trim().max(240).optional(),
        phone: z.string().trim().max(40).optional(),
        schoolYear: z.string().trim().max(20).optional(),
        photo: z.string().trim().max(190).optional(),
        birthCertificate: z.string().trim().max(190).optional(),
        transferCertificate: z.string().trim().max(190).optional(),
        enrolledAt: z.string().trim().max(20).optional(),
        guardianName: z.string().trim().max(120).optional(),
        guardianEmail: z
          .string()
          .trim()
          .toLowerCase()
          .email()
          .max(190)
          .or(z.literal(""))
          .optional(),
        guardianPhone: z.string().trim().max(40).optional(),
        guardianAddress: z.string().trim().max(240).optional(),
        guardianRelation: z.string().trim().max(40).optional(),
        status: studentStatusField.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);

      let classId = existing.classId;
      if (input.classId !== undefined) {
        classId = input.classId
          ? (await assertClassAvailable(establishmentId, input.classId, existing.id)).id
          : null;
      }
      const firstName = input.firstName ?? existing.firstName;
      const lastName = input.lastName ?? existing.lastName;
      const birthDate = input.birthDate ?? existing.birthDate;
      await assertNoDuplicate(establishmentId, firstName, lastName, birthDate, existing.id);

      const updates: Partial<typeof students.$inferInsert> = {};
      if (input.firstName !== undefined) updates.firstName = input.firstName;
      if (input.lastName !== undefined) updates.lastName = input.lastName;
      if (input.classId !== undefined) updates.classId = classId;
      if (input.birthDate !== undefined) updates.birthDate = input.birthDate;
      if (input.sex !== undefined) updates.sex = input.sex;
      if (input.address !== undefined) updates.address = input.address;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.schoolYear !== undefined) updates.schoolYear = input.schoolYear;
      if (input.photo !== undefined) updates.photo = input.photo;
      if (input.birthCertificate !== undefined)
        updates.birthCertificate = input.birthCertificate;
      if (input.transferCertificate !== undefined)
        updates.transferCertificate = input.transferCertificate;
      if (input.enrolledAt !== undefined) updates.enrolledAt = input.enrolledAt;
      if (input.status !== undefined) updates.status = input.status;
      if (Object.keys(updates).length) {
        await db.update(students).set(updates).where(eq(students.id, existing.id));
      }
      const classChanged = input.classId !== undefined && classId !== existing.classId;
      const yearChanged =
        input.schoolYear !== undefined && input.schoolYear !== existing.schoolYear;
      if (classChanged || yearChanged) {
        await addEnrollment({
          establishmentId,
          studentId: existing.id,
          schoolYear: input.schoolYear ?? existing.schoolYear,
          classId: input.classId !== undefined ? classId : existing.classId,
          enrolledAt: input.enrolledAt ?? existing.enrolledAt,
          kind: classChanged ? "transfert" : "reinscription",
          status: input.status ?? existing.status,
          note: classChanged ? "Changement de classe" : "Mise à jour de l’année scolaire",
        });
      }

      if (input.guardianName !== undefined) {
        const links = await db
          .select()
          .from(studentGuardians)
          .where(eq(studentGuardians.studentId, existing.id))
          .limit(1);
        const link = links[0];
        if (link) {
          const guardianUpdates: Partial<typeof guardians.$inferInsert> = {
            name: input.guardianName,
          };
          if (input.guardianEmail !== undefined) guardianUpdates.email = input.guardianEmail;
          if (input.guardianPhone !== undefined) guardianUpdates.phone = input.guardianPhone;
          if (input.guardianAddress !== undefined)
            guardianUpdates.address = input.guardianAddress;
          await db
            .update(guardians)
            .set(guardianUpdates)
            .where(eq(guardians.id, link.guardianId));
          if (input.guardianRelation !== undefined) {
            await db
              .update(studentGuardians)
              .set({ relation: input.guardianRelation })
              .where(
                and(
                  eq(studentGuardians.studentId, existing.id),
                  eq(studentGuardians.guardianId, link.guardianId),
                ),
              );
          }
        } else {
          const guardianId = crypto.randomUUID();
          await db.insert(guardians).values({
            id: guardianId,
            establishmentId,
            name: input.guardianName,
            email: input.guardianEmail ?? "",
            phone: input.guardianPhone ?? "",
            address: input.guardianAddress ?? "",
          });
          await db.insert(studentGuardians).values({
            studentId: existing.id,
            guardianId,
            relation: input.guardianRelation || "Responsable légal",
          });
        }
      }

      const changed: string[] = [];
      if (input.firstName !== undefined && input.firstName !== existing.firstName)
        changed.push("prénom");
      if (input.lastName !== undefined && input.lastName !== existing.lastName)
        changed.push("nom");
      if (input.classId !== undefined && classId !== existing.classId) changed.push("classe");
      if (input.birthDate !== undefined && input.birthDate !== existing.birthDate)
        changed.push("date de naissance");
      if (input.sex !== undefined && input.sex !== existing.sex) changed.push("sexe");
      if (input.address !== undefined && input.address !== existing.address)
        changed.push("adresse");
      if (input.phone !== undefined && input.phone !== existing.phone)
        changed.push("téléphone");
      if (input.schoolYear !== undefined && input.schoolYear !== existing.schoolYear)
        changed.push("année scolaire");
      if (input.enrolledAt !== undefined && input.enrolledAt !== existing.enrolledAt)
        changed.push("date d’inscription");
      if (input.guardianName !== undefined) changed.push("responsable légal");
      if (input.status !== undefined && input.status !== existing.status) {
        await logStudentHistory(
          establishmentId,
          existing.id,
          "Changement de statut",
          `${existing.status} → ${input.status}`,
          context.user.name,
        );
      }
      if (changed.length) {
        await logStudentHistory(
          establishmentId,
          existing.id,
          "Modification du dossier",
          changed.join(", "),
          context.user.name,
        );
      }
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Modification d’un dossier élève",
        target: existing.reference,
        detail: changed.join(", "),
      });
      return { id: existing.id };
    }),

  changeStudentStatus: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        status: studentStatusField,
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);
      if (existing.status === input.status) return { id: existing.id };
      await db
        .update(students)
        .set({ status: input.status })
        .where(eq(students.id, existing.id));
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Changement de statut",
        `${existing.status} → ${input.status}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Changement de statut d’un élève",
        target: existing.reference,
        detail: `${existing.status} → ${input.status}`,
      });
      return { id: existing.id };
    }),

  /** Décision d'admission (§10.2). */
  decideAdmission: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        decision: z.enum(["accepté", "refusé", "liste d'attente"]),
        note: z.string().trim().max(400).default(""),
        classId: z.string().trim().max(60).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);
      let classId = existing.classId;
      if (input.classId) {
        const found = await assertClassAvailable(establishmentId, input.classId, existing.id);
        classId = found.id;
      }
      const status = input.decision === "accepté" ? "Inscrit" : existing.status;
      await db
        .update(students)
        .set({
          admissionDecision: input.decision,
          admissionNote: input.note,
          status,
          classId,
          archivedAt: input.decision === "accepté" ? "" : existing.archivedAt,
        })
        .where(eq(students.id, existing.id));
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Décision d’admission",
        `${input.decision}${input.note ? ` · ${input.note}` : ""}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Décision d’admission",
        target: existing.reference,
        detail: input.decision,
      });
      return { id: existing.id };
    }),

  /** Réinscription annuelle avec reprise contrôlée (§10.3). */
  reinscribeStudent: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        schoolYear: z.string().trim().min(4).max(20),
        classId: z.string().trim().max(60).optional(),
        enrolledAt: z.string().trim().max(20).default(""),
        note: z.string().trim().max(400).default(""),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);
      let classId = existing.classId;
      if (input.classId) {
        const found = await assertClassAvailable(establishmentId, input.classId, existing.id);
        classId = found.id;
      }
      const enrolledAt = input.enrolledAt || new Date().toISOString().slice(0, 10);
      await db
        .update(students)
        .set({
          schoolYear: input.schoolYear,
          classId,
          enrolledAt,
          status: "Inscrit",
          archivedAt: "",
        })
        .where(eq(students.id, existing.id));
      await addEnrollment({
        establishmentId,
        studentId: existing.id,
        schoolYear: input.schoolYear,
        classId,
        enrolledAt,
        kind: "reinscription",
        status: "Inscrit",
        note: input.note,
      });
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Réinscription",
        `${input.schoolYear}${input.note ? ` · ${input.note}` : ""}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Réinscription d’un élève",
        target: existing.reference,
        detail: input.schoolYear,
      });
      return { id: existing.id };
    }),

  /** Transfert entre classes avec historique. */
  transferStudent: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        classId: z.string().trim().min(1).max(60),
        reason: z.string().trim().max(400).default(""),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);
      const target = await assertClassAvailable(establishmentId, input.classId, existing.id);
      const previousClass = existing.classId
        ? (
            await db
              .select({ name: classes.name })
              .from(classes)
              .where(eq(classes.id, existing.classId))
              .limit(1)
          )[0]?.name ?? "—"
        : "—";
      await db
        .update(students)
        .set({ classId: target.id })
        .where(eq(students.id, existing.id));
      await addEnrollment({
        establishmentId,
        studentId: existing.id,
        schoolYear: existing.schoolYear,
        classId: target.id,
        enrolledAt: existing.enrolledAt,
        kind: "transfert",
        status: existing.status,
        note: input.reason,
      });
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Transfert de classe",
        `${previousClass} → ${target.name}${input.reason ? ` · ${input.reason}` : ""}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Transfert d’un élève",
        target: existing.reference,
        detail: `${previousClass} → ${target.name}`,
      });
      return { id: existing.id, classId: target.id };
    }),

  /** Transfert vers un autre établissement (§10.3). */
  transferOutStudent: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        destination: z.string().trim().min(2).max(160),
        reason: z.string().trim().max(400).default(""),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);
      await db
        .update(students)
        .set({ status: "Transféré" })
        .where(eq(students.id, existing.id));
      await addEnrollment({
        establishmentId,
        studentId: existing.id,
        schoolYear: existing.schoolYear,
        classId: existing.classId,
        enrolledAt: existing.enrolledAt,
        kind: "transfert_externe",
        status: "Transféré",
        note: `${input.destination}${input.reason ? ` · ${input.reason}` : ""}`,
      });
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Transfert vers un autre établissement",
        `${input.destination}${input.reason ? ` · ${input.reason}` : ""}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Transfert sortant d’un élève",
        target: existing.reference,
        detail: input.destination,
      });
      return { id: existing.id };
    }),

  /** Archivage du dossier (§10.3). */
  archiveStudent: authed
    .input(
      z.object({
        id: z.string().trim().min(1).max(60),
        reason: z.string().trim().max(400).default(""),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.id);
      const archivedAt = new Date().toISOString().slice(0, 10);
      await db
        .update(students)
        .set({ status: "Archivé", archivedAt })
        .where(eq(students.id, existing.id));
      await addEnrollment({
        establishmentId,
        studentId: existing.id,
        schoolYear: existing.schoolYear,
        classId: existing.classId,
        enrolledAt: existing.enrolledAt,
        kind: "archivage",
        status: "Archivé",
        note: input.reason,
      });
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Archivage du dossier",
        input.reason || archivedAt,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Archivage d’un dossier élève",
        target: existing.reference,
        detail: input.reason,
      });
      return { id: existing.id };
    }),

  addStudentGuardian: authed
    .input(
      z.object({
        studentId: z.string().trim().min(1).max(60),
        name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(40).default(""),
        email: z.string().trim().toLowerCase().email().max(190).or(z.literal("")).default(""),
        address: z.string().trim().max(240).default(""),
        relation: z.string().trim().max(40).default("Responsable légal"),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const existing = await findStudentOf(establishmentId, input.studentId);
      const currentGuardians = await db
        .select()
        .from(guardians)
        .where(eq(guardians.establishmentId, establishmentId));
      const match =
        (input.email ? currentGuardians.find((g) => g.email === input.email) : undefined) ??
        currentGuardians.find((g) => g.name === input.name);
      const guardianId = match?.id ?? crypto.randomUUID();
      if (!match) {
        await db.insert(guardians).values({
          id: guardianId,
          establishmentId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
        });
      }
      const link = await db
        .select()
        .from(studentGuardians)
        .where(
          and(
            eq(studentGuardians.studentId, existing.id),
            eq(studentGuardians.guardianId, guardianId),
          ),
        )
        .limit(1);
      if (!link.length) {
        await db.insert(studentGuardians).values({
          studentId: existing.id,
          guardianId,
          relation: input.relation,
        });
      }
      await logStudentHistory(
        establishmentId,
        existing.id,
        "Ajout d’un responsable",
        `${input.name} · ${input.relation}`,
        context.user.name,
      );
      return { id: guardianId };
    }),

  updateStudentGuardian: authed
    .input(
      z.object({
        studentId: z.string().trim().min(1).max(60),
        guardianId: z.string().trim().min(1).max(60),
        name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(40).default(""),
        email: z.string().trim().toLowerCase().email().max(190).or(z.literal("")).default(""),
        address: z.string().trim().max(240).default(""),
        relation: z.string().trim().max(40).default("Responsable légal"),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findStudentOf(establishmentId, input.studentId);
      const rows = await db
        .select()
        .from(guardians)
        .where(
          and(
            eq(guardians.id, input.guardianId),
            eq(guardians.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Responsable inconnu." });
      await db
        .update(guardians)
        .set({
          name: input.name,
          phone: input.phone,
          email: input.email,
          address: input.address,
        })
        .where(eq(guardians.id, input.guardianId));
      await db
        .update(studentGuardians)
        .set({ relation: input.relation })
        .where(
          and(
            eq(studentGuardians.studentId, input.studentId),
            eq(studentGuardians.guardianId, input.guardianId),
          ),
        );
      await logStudentHistory(
        establishmentId,
        input.studentId,
        "Modification d’un responsable",
        `${input.name} · ${input.relation}`,
        context.user.name,
      );
      return { id: input.guardianId };
    }),

  removeStudentGuardian: authed
    .input(
      z.object({
        studentId: z.string().trim().min(1).max(60),
        guardianId: z.string().trim().min(1).max(60),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findStudentOf(establishmentId, input.studentId);
      const rows = await db
        .select()
        .from(guardians)
        .where(
          and(
            eq(guardians.id, input.guardianId),
            eq(guardians.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Responsable inconnu." });
      await db
        .delete(studentGuardians)
        .where(
          and(
            eq(studentGuardians.studentId, input.studentId),
            eq(studentGuardians.guardianId, input.guardianId),
          ),
        );
      const remaining = await db
        .select()
        .from(studentGuardians)
        .where(eq(studentGuardians.guardianId, input.guardianId))
        .limit(1);
      if (!remaining.length) {
        await db.delete(guardians).where(eq(guardians.id, input.guardianId));
      }
      await logStudentHistory(
        establishmentId,
        input.studentId,
        "Retrait d’un responsable",
        rows[0].name,
        context.user.name,
      );
      return { id: input.guardianId };
    }),

  createGuardian: authed.input(guardianInput).handler(async ({ context, input }) => {    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const id = crypto.randomUUID();
    await db.insert(guardians).values({
      id,
      establishmentId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      status: input.status,
    });
    const validIds = await ensureStudentIds(establishmentId, input.studentIds);
    if (validIds.length) {
      await db
        .insert(studentGuardians)
        .values(validIds.map((studentId) => ({ studentId, guardianId: id })));
    }
    return { id };
  }),
};

async function nextReference(establishmentId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.establishmentId, establishmentId));
  const year = new Date().getFullYear();
  let sequence = Number(rows[0]?.n ?? 0) + 1;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const reference = `SC-${year}-${String(sequence).padStart(3, "0")}`;
    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.reference, reference))
      .limit(1);
    if (!existing.length) return reference;
    sequence += 1;
  }
  return `SC-${year}-${Date.now().toString(36).toUpperCase()}`;
}

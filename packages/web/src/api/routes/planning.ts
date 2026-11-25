import { ORPCError } from "@orpc/server";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  classes,
  guardians,
  rooms,
  staff,
  studentGuardians,
  students,
  subjects,
  timeSlots,
  timetableEntries,
} from "../database/schema";
import { authed, MANAGE_ROLES, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { tenantOf } from "./scolarite-helpers";

const dayNames = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const slotInput = z.object({
  name: z.string().trim().max(60).default(""),
  dayOfWeek: z.number().int().min(1).max(6),
  startsAt: z.string().trim().regex(/^\d{2}:\d{2}$/),
  endsAt: z.string().trim().regex(/^\d{2}:\d{2}$/),
  kind: z.enum(["Cours", "Pause"]).default("Cours"),
});

const entryInput = z.object({
  classId: z.string().trim().min(1).max(60),
  subjectId: z.string().trim().min(1).max(60),
  slotId: z.string().trim().min(1).max(60),
  staffId: z.string().trim().max(60).optional(),
  roomId: z.string().trim().max(60).optional(),
  note: z.string().trim().max(240).default(""),
});

type RawEntry = {
  id: string;
  classId: string;
  subjectId: string;
  staffId: string | null;
  roomId: string | null;
  slotId: string;
  status: string;
  note: string;
  publishedAt: string;
  slotName: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  slotKind: string;
  className: string;
  classCapacity: number;
  subjectName: string;
  staffName: string | null;
  roomName: string | null;
  roomCapacity: number | null;
};

type Conflict = { kind: string; message: string; entryIds: string[] };

function assertTimeOrder(startsAt: string, endsAt: string) {
  if (startsAt >= endsAt) {
    throw new ORPCError("BAD_REQUEST", {
      message: "L’heure de fin doit être postérieure à l’heure de début.",
    });
  }
}

async function loadEntries(establishmentId: string): Promise<RawEntry[]> {
  const rows = await db
    .select({
      id: timetableEntries.id,
      classId: timetableEntries.classId,
      subjectId: timetableEntries.subjectId,
      staffId: timetableEntries.staffId,
      roomId: timetableEntries.roomId,
      slotId: timetableEntries.slotId,
      status: timetableEntries.status,
      note: timetableEntries.note,
      publishedAt: timetableEntries.publishedAt,
      slotName: timeSlots.name,
      dayOfWeek: timeSlots.dayOfWeek,
      startsAt: timeSlots.startsAt,
      endsAt: timeSlots.endsAt,
      slotKind: timeSlots.kind,
      className: classes.name,
      classCapacity: classes.capacity,
      subjectName: subjects.name,
      staffName: staff.name,
      roomName: rooms.name,
      roomCapacity: rooms.capacity,
    })
    .from(timetableEntries)
    .innerJoin(timeSlots, eq(timeSlots.id, timetableEntries.slotId))
    .innerJoin(classes, eq(classes.id, timetableEntries.classId))
    .innerJoin(subjects, eq(subjects.id, timetableEntries.subjectId))
    .leftJoin(staff, eq(staff.id, timetableEntries.staffId))
    .leftJoin(rooms, eq(rooms.id, timetableEntries.roomId))
    .where(
      and(
        eq(timetableEntries.establishmentId, establishmentId),
        ne(timetableEntries.status, "Archivé"),
      ),
    )
    .orderBy(asc(timeSlots.dayOfWeek), asc(timeSlots.startsAt));
  return rows as RawEntry[];
}

/**
 * Une nouvelle version brouillon ou validée masque l'ancienne version publiée pour le personnel.
 * Les doublons d'une même version sont conservés afin que le moteur de conflits les signale.
 */
function resolveWorkingEntries(entries: RawEntry[]) {
  const byClassSlot = new Map<string, RawEntry[]>();
  for (const entry of entries) {
    const key = `${entry.classId}:${entry.slotId}`;
    byClassSlot.set(key, [...(byClassSlot.get(key) ?? []), entry]);
  }
  const resolved: RawEntry[] = [];
  for (const group of byClassSlot.values()) {
    const working = group.filter((entry) => entry.status !== "Publié");
    resolved.push(...(working.length ? working : group));
  }
  return resolved;
}

async function detectConflicts(
  establishmentId: string,
  entries: RawEntry[],
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];
  const studentRows = await db
    .select({ classId: students.classId, status: students.status })
    .from(students)
    .where(eq(students.establishmentId, establishmentId));
  const enrolled = new Map<string, number>();
  for (const student of studentRows) {
    if (!student.classId) continue;
    if (["Archivé", "Transféré", "Sorti"].includes(student.status)) continue;
    enrolled.set(student.classId, (enrolled.get(student.classId) ?? 0) + 1);
  }

  const byClass = new Map<string, RawEntry[]>();
  const byStaff = new Map<string, RawEntry[]>();
  const byRoom = new Map<string, RawEntry[]>();
  for (const entry of entries) {
    const classKey = `${entry.classId}:${entry.slotId}`;
    byClass.set(classKey, [...(byClass.get(classKey) ?? []), entry]);
    if (entry.staffId) {
      const staffKey = `${entry.staffId}:${entry.slotId}`;
      byStaff.set(staffKey, [...(byStaff.get(staffKey) ?? []), entry]);
    }
    if (entry.roomId) {
      const roomKey = `${entry.roomId}:${entry.slotId}`;
      byRoom.set(roomKey, [...(byRoom.get(roomKey) ?? []), entry]);
    }
    if (entry.slotKind !== "Cours") {
      conflicts.push({
        kind: "slot",
        message: `Le créneau ${entry.slotName || `${entry.startsAt}-${entry.endsAt}`} est une pause et ne peut pas accueillir un cours.`,
        entryIds: [entry.id],
      });
    }
    if (
      entry.roomCapacity !== null &&
      entry.roomCapacity < (enrolled.get(entry.classId) ?? 0)
    ) {
      conflicts.push({
        kind: "capacité",
        message: `La salle ${entry.roomName ?? ""} est trop petite pour ${entry.className} (${entry.roomCapacity} places pour ${enrolled.get(entry.classId) ?? 0} élèves).`,
        entryIds: [entry.id],
      });
    }
  }

  for (const list of byClass.values()) {
    if (list.length > 1) {
      conflicts.push({
        kind: "classe",
        message: `${list[0].className} a plusieurs cours au même créneau (${list[0].startsAt}–${list[0].endsAt}).`,
        entryIds: list.map((e) => e.id),
      });
    }
  }
  for (const list of byStaff.values()) {
    if (list.length > 1) {
      conflicts.push({
        kind: "enseignant",
        message: `${list[0].staffName ?? "Un enseignant"} est affecté à plusieurs cours au même créneau (${list[0].startsAt}–${list[0].endsAt}).`,
        entryIds: list.map((e) => e.id),
      });
    }
  }
  for (const list of byRoom.values()) {
    if (list.length > 1) {
      conflicts.push({
        kind: "salle",
        message: `La salle ${list[0].roomName ?? ""} est affectée à plusieurs cours au même créneau (${list[0].startsAt}–${list[0].endsAt}).`,
        entryIds: list.map((e) => e.id),
      });
    }
  }
  return conflicts;
}

async function assertClassOf(establishmentId: string, classId: string) {
  const rows = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Classe inconnue." });
  return rows[0];
}

async function assertSubjectOf(establishmentId: string, subjectId: string) {
  const rows = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Matière inconnue." });
  return rows[0];
}

async function assertSlotOf(establishmentId: string, slotId: string) {
  const rows = await db
    .select()
    .from(timeSlots)
    .where(and(eq(timeSlots.id, slotId), eq(timeSlots.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Créneau inconnu." });
  return rows[0];
}

export const planning = {
  /** Planning, créneaux et conflits visibles selon le rôle. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) {
      return {
        slots: [],
        entries: [],
        conflicts: [],
        classes: [],
        subjects: [],
        staff: [],
        rooms: [],
        stats: { total: 0, draft: 0, validated: 0, published: 0 },
      };
    }
    const [slotRows, classRows, subjectRows, staffRows, roomRows, entries] =
      await Promise.all([
        db
          .select()
          .from(timeSlots)
          .where(eq(timeSlots.establishmentId, establishmentId))
          .orderBy(asc(timeSlots.dayOfWeek), asc(timeSlots.startsAt)),
        db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
        db.select().from(subjects).where(eq(subjects.establishmentId, establishmentId)),
        db.select().from(staff).where(eq(staff.establishmentId, establishmentId)),
        db.select().from(rooms).where(eq(rooms.establishmentId, establishmentId)),
        loadEntries(establishmentId),
      ]);

    const working = resolveWorkingEntries(entries);
    const role = context.user.role;
    let visible = working;
    let conflicts: Conflict[] = [];

    if (role === "direction" || role === "administration") {
      conflicts = await detectConflicts(establishmentId, working);
    } else if (role === "teacher") {
      const myStaff = staffRows.filter((row) => row.userId === context.user.id).map((r) => r.id);
      visible = working.filter(
        (entry) =>
          entry.status === "Publié" || (entry.staffId ? myStaff.includes(entry.staffId) : false),
      );
      conflicts = [];
    } else if (role === "parent" || role === "student") {
      let classIds: string[] = [];
      if (role === "student") {
        classIds = (await db
          .select({ classId: students.classId })
          .from(students)
          .where(
            and(
              eq(students.establishmentId, establishmentId),
              eq(students.userId, context.user.id),
            ),
          ))
          .map((row) => row.classId)
          .filter((id): id is string => Boolean(id));
      } else {
        const links = await db
          .select({ studentId: studentGuardians.studentId })
          .from(studentGuardians)
          .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
          .where(
            and(
              eq(guardians.establishmentId, establishmentId),
              eq(guardians.userId, context.user.id),
            ),
          );
        if (links.length) {
          classIds = (
            await db
              .select({ classId: students.classId })
              .from(students)
              .where(
                and(
                  eq(students.establishmentId, establishmentId),
                  inArray(
                    students.id,
                    links.map((link) => link.studentId),
                  ),
                ),
              )
          )
            .map((row) => row.classId)
            .filter((id): id is string => Boolean(id));
        }
      }
      visible = entries.filter(
        (entry) => entry.status === "Publié" && classIds.includes(entry.classId),
      );
      conflicts = [];
    } else {
      visible = entries.filter((entry) => entry.status === "Publié");
      conflicts = [];
    }

    const familyScoped = role === "parent" || role === "student";
    const visibleClassIds = new Set(visible.map((entry) => entry.classId));
    const visibleSubjectIds = new Set(visible.map((entry) => entry.subjectId));
    const visibleStaffIds = new Set(
      visible.map((entry) => entry.staffId).filter((id): id is string => Boolean(id)),
    );
    const visibleRoomIds = new Set(
      visible.map((entry) => entry.roomId).filter((id): id is string => Boolean(id)),
    );
    const visibleSlotIds = new Set(visible.map((entry) => entry.slotId));

    return {
      slots: familyScoped
        ? slotRows.filter((slot) => visibleSlotIds.has(slot.id))
        : slotRows,
      entries: visible,
      conflicts,
      classes: familyScoped
        ? classRows.filter((row) => visibleClassIds.has(row.id))
        : classRows,
      subjects: familyScoped
        ? subjectRows.filter((row) => visibleSubjectIds.has(row.id))
        : subjectRows,
      staff: familyScoped
        ? staffRows.filter((row) => visibleStaffIds.has(row.id))
        : staffRows,
      rooms: familyScoped
        ? roomRows.filter((row) => visibleRoomIds.has(row.id))
        : roomRows,
      stats: {
        total: visible.length,
        draft: visible.filter((e) => e.status === "Brouillon").length,
        validated: visible.filter((e) => e.status === "Validé").length,
        published: visible.filter((e) => e.status === "Publié").length,
      },
    };
  }),

  createSlot: authed.input(slotInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    assertTimeOrder(input.startsAt, input.endsAt);
    const id = crypto.randomUUID();
    await db.insert(timeSlots).values({
      id,
      establishmentId,
      name: input.name || `${dayNames[input.dayOfWeek]} ${input.startsAt}`,
      dayOfWeek: input.dayOfWeek,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      kind: input.kind,
      status: "Actif",
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’un créneau",
      target: `${dayNames[input.dayOfWeek]} ${input.startsAt}–${input.endsAt}`,
    });
    return { id };
  }),

  createEntry: authed.input(entryInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    await assertClassOf(establishmentId, input.classId);
    await assertSubjectOf(establishmentId, input.subjectId);
    const slot = await assertSlotOf(establishmentId, input.slotId);
    if (slot.kind !== "Cours") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Un cours ne peut pas être placé sur un créneau de pause.",
      });
    }
    if (input.staffId) {
      const found = await db
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.id, input.staffId), eq(staff.establishmentId, establishmentId)))
        .limit(1);
      if (!found.length) throw new ORPCError("BAD_REQUEST", { message: "Enseignant inconnu." });
    }
    if (input.roomId) {
      const found = await db
        .select({ id: rooms.id })
        .from(rooms)
        .where(and(eq(rooms.id, input.roomId), eq(rooms.establishmentId, establishmentId)))
        .limit(1);
      if (!found.length) throw new ORPCError("BAD_REQUEST", { message: "Salle inconnue." });
    }
    const id = crypto.randomUUID();
    await db.insert(timetableEntries).values({
      id,
      establishmentId,
      classId: input.classId,
      subjectId: input.subjectId,
      slotId: input.slotId,
      staffId: input.staffId || null,
      roomId: input.roomId || null,
      status: "Brouillon",
      note: input.note,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Ajout d’un cours au planning",
      target: `${input.classId} · ${input.slotId}`,
    });
    return { id };
  }),

  deleteEntry: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(timetableEntries)
        .where(
          and(
            eq(timetableEntries.id, input.id),
            eq(timetableEntries.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const entry = rows[0];
      if (!entry) throw new ORPCError("BAD_REQUEST", { message: "Cours inconnu." });
      if (entry.status === "Publié") {
        // La version publiée est conservée dans l'historique, mais retirée du planning courant.
        await db
          .update(timetableEntries)
          .set({ status: "Archivé" })
          .where(eq(timetableEntries.id, entry.id));
        await logAudit({
          establishmentId,
          userId: context.user.id,
          actor: context.user.name,
          action: "Retrait d’un cours publié du planning",
          target: entry.id,
        });
        return { id: entry.id, archived: true };
      }
      await db.delete(timetableEntries).where(eq(timetableEntries.id, entry.id));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Suppression d’un cours du planning",
        target: entry.id,
      });
      return { id: entry.id, archived: false };
    }),

  generateProposal: authed
    .input(z.object({ classId: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const classRow = await assertClassOf(establishmentId, input.classId);
      const [slotRows, subjectRows, staffRows, roomRows, entries, studentRows] =
        await Promise.all([
          db
            .select()
            .from(timeSlots)
            .where(
              and(
                eq(timeSlots.establishmentId, establishmentId),
                eq(timeSlots.kind, "Cours"),
                eq(timeSlots.status, "Actif"),
              ),
            )
            .orderBy(asc(timeSlots.dayOfWeek), asc(timeSlots.startsAt)),
          db
            .select()
            .from(subjects)
            .where(
              and(
                eq(subjects.establishmentId, establishmentId),
                eq(subjects.status, "Actif"),
              ),
            ),
          db
            .select()
            .from(staff)
            .where(
              and(eq(staff.establishmentId, establishmentId), eq(staff.status, "Actif")),
            ),
          db
            .select()
            .from(rooms)
            .where(
              and(eq(rooms.establishmentId, establishmentId), eq(rooms.status, "Disponible")),
            ),
          loadEntries(establishmentId),
          db
            .select({ id: students.id, status: students.status })
            .from(students)
            .where(
              and(
                eq(students.establishmentId, establishmentId),
                eq(students.classId, input.classId),
              ),
            ),
        ]);
      if (!slotRows.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Créez d’abord des créneaux de cours.",
        });
      }
      if (!subjectRows.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Créez d’abord des matières actives.",
        });
      }
      const working = resolveWorkingEntries(entries);
      const occupied = new Set(
        working
          .filter((entry) => entry.classId === input.classId)
          .map((entry) => entry.slotId),
      );
      const usedStaff = new Set(
        working.map((entry) => (entry.staffId ? `${entry.staffId}:${entry.slotId}` : "")),
      );
      const usedRooms = new Set(
        working.map((entry) => (entry.roomId ? `${entry.roomId}:${entry.slotId}` : "")),
      );
      const freeSlots = slotRows.filter((slot) => !occupied.has(slot.id));
      const enrolled = studentRows.filter(
        (student) => !["Archivé", "Transféré", "Sorti"].includes(student.status),
      ).length;
      const requirements: typeof subjectRows = [];
      for (const subject of subjectRows) {
        const hours = Math.max(1, subject.weeklyHours || 1);
        for (let index = 0; index < hours; index += 1) requirements.push(subject);
      }
      let created = 0;
      let index = 0;
      for (const slot of freeSlots) {
        if (index >= requirements.length) break;
        const subject = requirements[index];
        const preferredStaff =
          staffRows.find(
            (person) =>
              person.type === "Enseignant" &&
              !usedStaff.has(`${person.id}:${slot.id}`) &&
              (person.assignments.includes(classRow.name) ||
                person.specialty.includes(subject.name)),
          ) ??
          staffRows.find(
            (person) =>
              person.type === "Enseignant" && !usedStaff.has(`${person.id}:${slot.id}`),
          );
        const room =
          roomRows.find(
            (room) =>
              room.capacity >= enrolled && !usedRooms.has(`${room.id}:${slot.id}`),
          ) ?? null;
        await db.insert(timetableEntries).values({
          id: crypto.randomUUID(),
          establishmentId,
          classId: input.classId,
          subjectId: subject.id,
          staffId: preferredStaff?.id ?? null,
          roomId: room?.id ?? null,
          slotId: slot.id,
          status: "Brouillon",
          note: "Proposition automatique",
        });
        if (preferredStaff) usedStaff.add(`${preferredStaff.id}:${slot.id}`);
        if (room) usedRooms.add(`${room.id}:${slot.id}`);
        created += 1;
        index += 1;
      }
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Génération d’une proposition de planning",
        target: classRow.name,
        detail: `${created} cours`,
      });
      return {
        created,
        remaining: Math.max(0, requirements.length - created),
        freeSlots: Math.max(0, freeSlots.length - created),
      };
    }),

  validateSchedule: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const entries = resolveWorkingEntries(await loadEntries(establishmentId));
    if (!entries.length) {
      throw new ORPCError("BAD_REQUEST", { message: "Le planning est vide." });
    }
    const conflicts = await detectConflicts(establishmentId, entries);
    if (conflicts.length) {
      throw new ORPCError("BAD_REQUEST", {
        message: `${conflicts.length} conflit(s) doivent être corrigés avant validation.`,
      });
    }
    await db
      .update(timetableEntries)
      .set({ status: "Validé" })
      .where(
        and(
          eq(timetableEntries.establishmentId, establishmentId),
          eq(timetableEntries.status, "Brouillon"),
        ),
      );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Validation du planning",
      target: `${entries.length} cours`,
    });
    return { count: entries.length, conflicts: 0 };
  }),

  publishSchedule: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const entries = resolveWorkingEntries(await loadEntries(establishmentId));
    if (!entries.length) {
      throw new ORPCError("BAD_REQUEST", { message: "Le planning est vide." });
    }
    const conflicts = await detectConflicts(establishmentId, entries);
    if (conflicts.length) {
      throw new ORPCError("BAD_REQUEST", {
        message: `${conflicts.length} conflit(s) bloquent la publication.`,
      });
    }
    if (entries.some((entry) => entry.status === "Brouillon")) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Validez le planning avant de le publier.",
      });
    }
    const publishedAt = new Date().toISOString().slice(0, 10);
    await db
      .update(timetableEntries)
      .set({ status: "Archivé" })
      .where(
        and(
          eq(timetableEntries.establishmentId, establishmentId),
          eq(timetableEntries.status, "Publié"),
        ),
      );
    for (const entry of entries) {
      await db
        .update(timetableEntries)
        .set({ status: "Publié", publishedAt })
        .where(eq(timetableEntries.id, entry.id));
    }
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Publication du planning",
      target: `${entries.length} cours`,
      detail: publishedAt,
    });
    return { count: entries.length, publishedAt };
  }),
};

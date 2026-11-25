import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  classes,
  guardians,
  lessons,
  studentGuardians,
  students,
  subjects,
} from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { tenantOf } from "./scolarite-helpers";

const TEACHING_ROLES = ["direction", "administration", "teacher"] as const;
const READ_ROLES = [
  "direction",
  "administration",
  "teacher",
  "supervisor",
  "parent",
  "student",
] as const;
const LESSON_STATUSES = ["Planifié", "Réalisé", "Annulé"] as const;

const lessonInput = z.object({
  classId: z.string().trim().min(1).max(60),
  subjectId: z.string().trim().max(60).default(""),
  teacherName: z.string().trim().max(120).default(""),
  date: z.string().trim().max(20).default(""),
  startTime: z.string().trim().max(10).default(""),
  endTime: z.string().trim().max(10).default(""),
  title: z.string().trim().min(2).max(180),
  content: z.string().trim().max(4000).default(""),
  homework: z.string().trim().max(2000).default(""),
  status: z.enum(LESSON_STATUSES).default("Planifié"),
});

const lessonUpdateInput = lessonInput.extend({
  id: z.string().trim().min(1).max(60),
});

async function assertClassOf(establishmentId: string, classId: string) {
  const rows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Classe inconnue." });
}

async function assertSubjectOf(establishmentId: string, subjectId: string) {
  if (!subjectId) return;
  const rows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Matière inconnue." });
}

async function familyClassIds(establishmentId: string, userId: string, role: string) {
  let studentIds: string[] = [];
  if (role === "student") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.establishmentId, establishmentId), eq(students.userId, userId)));
    studentIds = rows.map((row) => row.id);
  } else {
    const myGuardians = await db
      .select({ id: guardians.id })
      .from(guardians)
      .where(
        and(eq(guardians.establishmentId, establishmentId), eq(guardians.userId, userId)),
      );
    if (myGuardians.length) {
      const links = await db
        .select({ studentId: studentGuardians.studentId })
        .from(studentGuardians)
        .where(
          inArray(
            studentGuardians.guardianId,
            myGuardians.map((row) => row.id),
          ),
        );
      studentIds = links.map((row) => row.studentId);
    }
  }
  if (!studentIds.length) return [] as string[];
  const rows = await db
    .select({ classId: students.classId })
    .from(students)
    .where(
      and(eq(students.establishmentId, establishmentId), inArray(students.id, studentIds)),
    );
  return [...new Set(rows.map((row) => row.classId).filter(Boolean))] as string[];
}

async function findLesson(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Séance inconnue." });
  return rows[0];
}

/** Cahier de textes : séances de cours et devoirs (§15). */
export const lessonsApi = {
  /** Séances visibles pour l'utilisateur (staff : tout, familles : leur classe). */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...READ_ROLES]);
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) return { lessons: [], classes: [], subjects: [] };
    const family = context.user.role === "parent" || context.user.role === "student";
    const allowedClassIds = family
      ? await familyClassIds(establishmentId, context.user.id, context.user.role)
      : null;

    const [lessonRows, classRows, subjectRows] = await Promise.all([
      db
        .select()
        .from(lessons)
        .where(eq(lessons.establishmentId, establishmentId))
        .orderBy(desc(lessons.date), asc(lessons.startTime)),
      db
        .select()
        .from(classes)
        .where(eq(classes.establishmentId, establishmentId))
        .orderBy(asc(classes.name)),
      db
        .select()
        .from(subjects)
        .where(eq(subjects.establishmentId, establishmentId))
        .orderBy(asc(subjects.name)),
    ]);
    const classById = new Map(classRows.map((row) => [row.id, row]));
    const subjectById = new Map(subjectRows.map((row) => [row.id, row]));

    const visible = lessonRows.filter((lesson) => {
      if (allowedClassIds === null) return true;
      if (!allowedClassIds.includes(lesson.classId)) return false;
      return lesson.status !== "Annulé";
    });

    return {
      lessons: visible.map((lesson) => ({
        id: lesson.id,
        classId: lesson.classId,
        className: classById.get(lesson.classId)?.name ?? "",
        subjectId: lesson.subjectId,
        subjectName: lesson.subjectId ? subjectById.get(lesson.subjectId)?.name ?? "" : "",
        teacherName: lesson.teacherName,
        date: lesson.date,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        title: lesson.title,
        content: lesson.content,
        homework: lesson.homework,
        status: lesson.status,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      })),
      classes: family
        ? classRows
            .filter((row) => allowedClassIds?.includes(row.id))
            .map((row) => ({ id: row.id, name: row.name }))
        : classRows.map((row) => ({ id: row.id, name: row.name })),
      subjects: subjectRows.map((row) => ({ id: row.id, name: row.name })),
    };
  }),

  /** Ajoute une séance au cahier de textes. */
  create: authed.input(lessonInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...TEACHING_ROLES]);
    const establishmentId = tenantOf(context);
    await assertClassOf(establishmentId, input.classId);
    await assertSubjectOf(establishmentId, input.subjectId);
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(lessons).values({
      id,
      establishmentId,
      classId: input.classId,
      subjectId: input.subjectId || null,
      teacherName: input.teacherName,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      title: input.title,
      content: input.content,
      homework: input.homework,
      status: input.status,
      createdByUserId: context.user.id,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d'une séance",
      target: input.title,
      detail: input.date,
    });
    return { id };
  }),

  /** Met à jour une séance existante. */
  update: authed.input(lessonUpdateInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...TEACHING_ROLES]);
    const establishmentId = tenantOf(context);
    const existing = await findLesson(establishmentId, input.id);
    await assertClassOf(establishmentId, input.classId);
    await assertSubjectOf(establishmentId, input.subjectId);
    await db
      .update(lessons)
      .set({
        classId: input.classId,
        subjectId: input.subjectId || null,
        teacherName: input.teacherName,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        title: input.title,
        content: input.content,
        homework: input.homework,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, existing.id));
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Modification d'une séance",
      target: input.title,
      detail: input.status,
    });
    return { id: existing.id };
  }),

  /** Supprime une séance. */
  remove: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, [...TEACHING_ROLES]);
      const establishmentId = tenantOf(context);
      const existing = await findLesson(establishmentId, input.id);
      await db.delete(lessons).where(eq(lessons.id, existing.id));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Suppression d'une séance",
        target: existing.title,
        detail: existing.date,
      });
      return { id: existing.id };
    }),
};

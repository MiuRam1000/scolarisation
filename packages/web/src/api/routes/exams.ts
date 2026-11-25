import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { exams } from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { tenantOf } from "./scolarite-helpers";

const MANAGE_ROLES = ["direction", "administration", "teacher"] as const;
const READ_ROLES = ["direction", "administration", "teacher", "supervisor"] as const;
const EXAM_STATUSES = ["Brouillon", "Planifié", "En cours", "Terminé", "Archivé"] as const;
const EXAM_TYPES = ["Examen", "Conseil de classe", "Délibération", "Autre"] as const;

const examInput = z.object({
  title: z.string().trim().min(2).max(180),
  type: z.enum(EXAM_TYPES).default("Examen"),
  classesLabel: z.string().trim().max(240).default(""),
  datesLabel: z.string().trim().max(120).default(""),
  candidatesCount: z.coerce.number().int().min(0).max(100000).default(0),
  status: z.enum(EXAM_STATUSES).default("Brouillon"),
  notes: z.string().trim().max(4000).default(""),
  periodId: z.string().trim().max(60).default(""),
  academicYearId: z.string().trim().max(60).default(""),
});

const examUpdateInput = examInput.extend({
  id: z.string().trim().min(1).max(60),
});

async function findExam(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, id), eq(exams.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Examen ou délibération introuvable." });
  return rows[0];
}

/** Examens et délibérations (§19). */
export const examsApi = {
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...READ_ROLES]);
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) return { exams: [] };
    const rows = await db
      .select()
      .from(exams)
      .where(eq(exams.establishmentId, establishmentId))
      .orderBy(desc(exams.createdAt));
    return { exams: rows };
  }),

  create: authed.input(examInput).handler(async ({ input, context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...MANAGE_ROLES]);
    const establishmentId = tenantOf(context);
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(exams).values({
      id,
      establishmentId,
      academicYearId: input.academicYearId || null,
      periodId: input.periodId || null,
      title: input.title,
      type: input.type,
      classesLabel: input.classesLabel,
      datesLabel: input.datesLabel,
      candidatesCount: input.candidatesCount,
      status: input.status,
      notes: input.notes,
      createdByUserId: context.user.id,
      createdByName: context.user.name,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création",
      target: "Examen/Délibération",
      detail: input.title,
    });
    return { id };
  }),

  update: authed.input(examUpdateInput).handler(async ({ input, context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...MANAGE_ROLES]);
    const establishmentId = tenantOf(context);
    await findExam(establishmentId, input.id);
    await db
      .update(exams)
      .set({
        academicYearId: input.academicYearId || null,
        periodId: input.periodId || null,
        title: input.title,
        type: input.type,
        classesLabel: input.classesLabel,
        datesLabel: input.datesLabel,
        candidatesCount: input.candidatesCount,
        status: input.status,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(exams.id, input.id), eq(exams.establishmentId, establishmentId)));
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Mise à jour",
      target: "Examen/Délibération",
      detail: input.title,
    });
    return { id: input.id };
  }),

  remove: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ input, context }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, [...MANAGE_ROLES]);
      const establishmentId = tenantOf(context);
      const exam = await findExam(establishmentId, input.id);
      await db
        .delete(exams)
        .where(and(eq(exams.id, input.id), eq(exams.establishmentId, establishmentId)));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Suppression",
        target: "Examen/Délibération",
        detail: exam.title,
      });
      return { id: input.id };
    }),
};

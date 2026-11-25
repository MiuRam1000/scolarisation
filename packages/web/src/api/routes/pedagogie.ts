import { ORPCError } from "@orpc/server";
import { and, asc, eq, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  classes,
  establishments,
  evaluations,
  grades,
  guardians,
  periods,
  reportCards,
  studentGuardians,
  students,
  subjects,
} from "../database/schema";
import { authed, MANAGE_ROLES, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { createNotifications, familyUserIdsForStudents } from "./notifications";
import { logStudentHistory, tenantOf } from "./scolarite-helpers";

const TEACHING_ROLES = ["direction", "administration", "teacher"] as const;

const evaluationInput = z.object({
  classId: z.string().trim().min(1).max(60),
  subjectId: z.string().trim().min(1).max(60),
  periodId: z.string().trim().max(60).optional(),
  name: z.string().trim().min(2).max(120),
  coefficient: z.number().int().min(1).max(10).default(1),
  maxScore: z.number().int().min(1).max(100).default(20),
  date: z.string().trim().max(20).default(""),
});

const gradeEntry = z.object({
  studentId: z.string().trim().min(1).max(60),
  score: z.number().min(0).max(100).nullable(),
  comment: z.string().trim().max(400).default(""),
});

function normalize(score: number, maxScore: number) {
  if (!maxScore) return 0;
  return (score / maxScore) * 20;
}

async function findEvaluation(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(evaluations)
    .where(and(eq(evaluations.id, id), eq(evaluations.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Évaluation inconnue." });
  return rows[0];
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

async function assertPeriodOf(establishmentId: string, periodId: string) {
  const rows = await db
    .select()
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Période inconnue." });
  return rows[0];
}

async function computeStudentReport(
  establishmentId: string,
  classId: string,
  periodId: string,
  studentId: string,
) {
  const evalRows = await db
    .select({
      id: evaluations.id,
      coefficient: evaluations.coefficient,
      maxScore: evaluations.maxScore,
      subjectId: evaluations.subjectId,
      subjectName: subjects.name,
      subjectCoefficient: subjects.coefficient,
    })
    .from(evaluations)
    .innerJoin(subjects, eq(subjects.id, evaluations.subjectId))
    .where(
      and(
        eq(evaluations.establishmentId, establishmentId),
        eq(evaluations.classId, classId),
        eq(evaluations.periodId, periodId),
        inArray(evaluations.status, ["Validé", "Publié"]),
      ),
    );
  if (!evalRows.length) {
    return { average: null as number | null, subjects: [] as Array<{ id: string; name: string; coefficient: number; average: number }> };
  }
  const evalById = new Map(evalRows.map((e) => [e.id, e]));
  const gradeRows = await db
    .select({
      evaluationId: grades.evaluationId,
      score: grades.score,
    })
    .from(grades)
    .where(
      and(
        eq(grades.establishmentId, establishmentId),
        eq(grades.studentId, studentId),
        inArray(
          grades.evaluationId,
          evalRows.map((e) => e.id),
        ),
      ),
    );
  const perSubject = new Map<string, { name: string; coefficient: number; total: number; weight: number }>();
  for (const row of evalRows) {
    if (!perSubject.has(row.subjectId)) {
      perSubject.set(row.subjectId, {
        name: row.subjectName,
        coefficient: row.subjectCoefficient,
        total: 0,
        weight: 0,
      });
    }
  }
  for (const grade of gradeRows) {
    if (grade.score === null) continue;
    const evaluation = evalById.get(grade.evaluationId);
    if (!evaluation) continue;
    const bucket = perSubject.get(evaluation.subjectId);
    if (!bucket) continue;
    bucket.total += normalize(grade.score, evaluation.maxScore) * evaluation.coefficient;
    bucket.weight += evaluation.coefficient;
  }
  let total = 0;
  let weight = 0;
  const subjectsResult: Array<{ id: string; name: string; coefficient: number; average: number }> = [];
  for (const [subjectId, bucket] of perSubject) {
    if (!bucket.weight) continue;
    const subjectAverage = bucket.total / bucket.weight;
    subjectsResult.push({
      id: subjectId,
      name: bucket.name,
      coefficient: bucket.coefficient,
      average: subjectAverage,
    });
    total += subjectAverage * bucket.coefficient;
    weight += bucket.coefficient;
  }
  subjectsResult.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return {
    average: weight > 0 ? total / weight : null,
    subjects: subjectsResult,
  };
}

/** Calcule la moyenne pondérée d'un élève sur les évaluations validées. */
async function computeAverages(establishmentId: string, classId: string, periodId: string) {
  const evalRows = await db
    .select({
      id: evaluations.id,
      coefficient: evaluations.coefficient,
      maxScore: evaluations.maxScore,
      subjectId: evaluations.subjectId,
      subjectCoefficient: subjects.coefficient,
    })
    .from(evaluations)
    .innerJoin(subjects, eq(subjects.id, evaluations.subjectId))
    .where(
      and(
        eq(evaluations.establishmentId, establishmentId),
        eq(evaluations.classId, classId),
        eq(evaluations.periodId, periodId),
        inArray(evaluations.status, ["Validé", "Publié"]),
      ),
    );
  const evalById = new Map(evalRows.map((e) => [e.id, e]));
  const gradeRows = evalRows.length
    ? await db
        .select({
          evaluationId: grades.evaluationId,
          studentId: grades.studentId,
          score: grades.score,
        })
        .from(grades)
        .where(
          and(
            eq(grades.establishmentId, establishmentId),
            inArray(
              grades.evaluationId,
              evalRows.map((e) => e.id),
            ),
          ),
        )
    : [];
  const byStudent = new Map<string, Map<string, { total: number; weight: number }>>();
  for (const grade of gradeRows) {
    if (grade.score === null) continue;
    const evaluation = evalById.get(grade.evaluationId);
    if (!evaluation) continue;
    const perSubject = byStudent.get(grade.studentId) ?? new Map();
    const bucket = perSubject.get(evaluation.subjectId) ?? { total: 0, weight: 0 };
    bucket.total += normalize(grade.score, evaluation.maxScore) * evaluation.coefficient;
    bucket.weight += evaluation.coefficient;
    perSubject.set(evaluation.subjectId, bucket);
    byStudent.set(grade.studentId, perSubject);
  }
  const result = new Map<string, number>();
  for (const [studentId, perSubject] of byStudent) {
    let total = 0;
    let weight = 0;
    for (const [subjectId, bucket] of perSubject) {
      if (!bucket.weight) continue;
      const subjectCoefficient = evalRows.find((e) => e.subjectId === subjectId)?.subjectCoefficient ?? 1;
      total += (bucket.total / bucket.weight) * subjectCoefficient;
      weight += subjectCoefficient;
    }
    if (weight > 0) result.set(studentId, total / weight);
  }
  return result;
}

export const pedagogie = {
  /** Évaluations, notes et bulletins visibles pour l'utilisateur. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) {
      return { evaluations: [], grades: [], reportCards: [] };
    }
    const [evalRows, gradeRows, reportRows, subjectRows, periodRows, classRows, studentRows] =
      await Promise.all([
        db
          .select()
          .from(evaluations)
          .where(eq(evaluations.establishmentId, establishmentId))
          .orderBy(asc(evaluations.date), asc(evaluations.name)),
        db.select().from(grades).where(eq(grades.establishmentId, establishmentId)),
        db
          .select()
          .from(reportCards)
          .where(eq(reportCards.establishmentId, establishmentId))
          .orderBy(asc(reportCards.createdAt)),
        db.select().from(subjects).where(eq(subjects.establishmentId, establishmentId)),
        db.select().from(periods).where(eq(periods.establishmentId, establishmentId)),
        db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
        db.select().from(students).where(eq(students.establishmentId, establishmentId)),
      ]);

    const subjectById = new Map(subjectRows.map((s) => [s.id, s]));
    const periodById = new Map(periodRows.map((p) => [p.id, p]));
    const classById = new Map(classRows.map((c) => [c.id, c]));
    const studentById = new Map(
      studentRows.map((s) => [s.id, `${s.firstName} ${s.lastName}`.trim()]),
    );

    let visibleStudentIds: Set<string> | null = null;
    if (context.user.role === "student") {
      const me = studentRows.find((s) => s.userId === context.user.id);
      visibleStudentIds = new Set(me ? [me.id] : []);
    } else if (context.user.role === "parent") {
      const myGuardians = await db
        .select({ id: guardians.id })
        .from(guardians)
        .where(
          and(
            eq(guardians.establishmentId, establishmentId),
            eq(guardians.userId, context.user.id),
          ),
        );
      const links = myGuardians.length
        ? await db
            .select({ studentId: studentGuardians.studentId })
            .from(studentGuardians)
            .where(
              inArray(
                studentGuardians.guardianId,
                myGuardians.map((g) => g.id),
              ),
            )
        : [];
      visibleStudentIds = new Set(links.map((l) => l.studentId));
    }

    const family = visibleStudentIds !== null;
    const visibleGrades = family
      ? gradeRows.filter((g) => visibleStudentIds!.has(g.studentId))
      : gradeRows;
    const visibleReports = family
      ? reportRows.filter(
          (r) => visibleStudentIds!.has(r.studentId) && r.status === "Publié",
        )
      : reportRows;

    return {
      evaluations: family
        ? []
        : evalRows.map((e) => {
        const evaluationGrades = gradeRows.filter((g) => g.evaluationId === e.id);
        const scored = evaluationGrades.filter((g) => g.score !== null);
        return {
          ...e,
          subjectName: subjectById.get(e.subjectId)?.name ?? "",
          subjectCoefficient: subjectById.get(e.subjectId)?.coefficient ?? 1,
          className: classById.get(e.classId)?.name ?? "",
          periodName: e.periodId ? periodById.get(e.periodId)?.name ?? "" : "",
          gradedCount: scored.length,
          studentCount: studentRows.filter(
            (s) =>
              s.classId === e.classId &&
              !["Archivé", "Transféré", "Sorti"].includes(s.status),
          ).length,
          average:
            scored.length > 0
              ? scored.reduce((sum, g) => sum + normalize(g.score ?? 0, e.maxScore), 0) /
                scored.length
              : null,
        };
      }),
      grades: family
        ? []
        : visibleGrades.map((g) => ({
            id: g.id,
            evaluationId: g.evaluationId,
            studentId: g.studentId,
            score: g.score,
            comment: g.comment,
          })),
      reportCards: visibleReports.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: studentById.get(r.studentId) ?? "",
        periodId: r.periodId,
        periodName: periodById.get(r.periodId)?.name ?? "",
        classId: r.classId,
        className: r.classId ? classById.get(r.classId)?.name ?? "" : "",
        average: r.average,
        status: r.status,
        generatedAt: r.generatedAt,
        publishedAt: r.publishedAt,
      })),
    };
  }),

  createEvaluation: authed.input(evaluationInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...TEACHING_ROLES]);
    const establishmentId = tenantOf(context);
    await assertClassOf(establishmentId, input.classId);
    await assertSubjectOf(establishmentId, input.subjectId);
    if (input.periodId) await assertPeriodOf(establishmentId, input.periodId);
    const id = crypto.randomUUID();
    await db.insert(evaluations).values({
      id,
      establishmentId,
      classId: input.classId,
      subjectId: input.subjectId,
      periodId: input.periodId || null,
      name: input.name,
      coefficient: input.coefficient,
      maxScore: input.maxScore,
      date: input.date || new Date().toISOString().slice(0, 10),
      status: "Brouillon",
      createdBy: context.user.name,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’une évaluation",
      target: input.name,
    });
    return { id };
  }),

  saveGrades: authed
    .input(
      z.object({
        evaluationId: z.string().trim().min(1).max(60),
        entries: z.array(gradeEntry).max(300),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, [...TEACHING_ROLES]);
      const establishmentId = tenantOf(context);
      const evaluation = await findEvaluation(establishmentId, input.evaluationId);
      if (evaluation.status === "Publié") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Une évaluation publiée ne peut plus être modifiée.",
        });
      }
      const classStudents = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.establishmentId, establishmentId),
            eq(students.classId, evaluation.classId),
            notInArray(students.status, ["Archivé", "Transféré", "Sorti"]),
          ),
        );
      const allowed = new Set(classStudents.map((s) => s.id));
      for (const entry of input.entries) {
        if (!allowed.has(entry.studentId)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Un élève transmis n’appartient pas à la classe de l’évaluation.",
          });
        }
        if (entry.score !== null && entry.score > evaluation.maxScore) {
          throw new ORPCError("BAD_REQUEST", {
            message: `La note doit être comprise entre 0 et ${evaluation.maxScore}.`,
          });
        }
        const existing = await db
          .select({ id: grades.id })
          .from(grades)
          .where(
            and(
              eq(grades.evaluationId, evaluation.id),
              eq(grades.studentId, entry.studentId),
            ),
          )
          .limit(1);
        if (existing.length) {
          await db
            .update(grades)
            .set({ score: entry.score, comment: entry.comment })
            .where(eq(grades.id, existing[0].id));
        } else {
          await db.insert(grades).values({
            id: crypto.randomUUID(),
            establishmentId,
            evaluationId: evaluation.id,
            studentId: entry.studentId,
            score: entry.score,
            comment: entry.comment,
          });
        }
      }
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Saisie de notes",
        target: evaluation.name,
        detail: `${input.entries.length} élève(s)`,
      });
      return { id: evaluation.id };
    }),

  validateEvaluation: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, [...TEACHING_ROLES]);
      const establishmentId = tenantOf(context);
      const evaluation = await findEvaluation(establishmentId, input.id);
      const classStudents = await db
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.establishmentId, establishmentId),
            eq(students.classId, evaluation.classId),
            notInArray(students.status, ["Archivé", "Transféré", "Sorti"]),
          ),
        );
      const gradeRows = await db
        .select({ studentId: grades.studentId, score: grades.score })
        .from(grades)
        .where(eq(grades.evaluationId, evaluation.id));
      const missing = classStudents.filter(
        (s) => !gradeRows.some((g) => g.studentId === s.id && g.score !== null),
      );
      if (missing.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: `${missing.length} note(s) manquante(s) : la validation est bloquée.`,
        });
      }
      await db
        .update(evaluations)
        .set({ status: "Validé" })
        .where(eq(evaluations.id, evaluation.id));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Validation d’une évaluation",
        target: evaluation.name,
      });
      return { id: evaluation.id, status: "Validé" };
    }),

  generateReportCards: authed
    .input(
      z.object({
        periodId: z.string().trim().min(1).max(60),
        classId: z.string().trim().min(1).max(60),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await assertPeriodOf(establishmentId, input.periodId);
      await assertClassOf(establishmentId, input.classId);
      const published = await db
        .select({ id: reportCards.id })
        .from(reportCards)
        .where(
          and(
            eq(reportCards.establishmentId, establishmentId),
            eq(reportCards.periodId, input.periodId),
            eq(reportCards.classId, input.classId),
            eq(reportCards.status, "Publié"),
          ),
        )
        .limit(1);
      if (published.length) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Des bulletins sont déjà publiés pour cette classe et cette période. Créez une nouvelle période pour recalculer.",
        });
      }
      const averages = await computeAverages(establishmentId, input.classId, input.periodId);
      if (!averages.size) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Aucune note validée pour cette classe et cette période.",
        });
      }
      const generatedAt = new Date().toISOString().slice(0, 10);
      let count = 0;
      for (const [studentId, average] of averages) {
        const existing = await db
          .select({ id: reportCards.id })
          .from(reportCards)
          .where(
            and(
              eq(reportCards.studentId, studentId),
              eq(reportCards.periodId, input.periodId),
            ),
          )
          .limit(1);
        if (existing.length) {
          await db
            .update(reportCards)
            .set({
              classId: input.classId,
              average,
              status: "Brouillon",
              generatedAt,
              publishedAt: "",
            })
            .where(eq(reportCards.id, existing[0].id));
        } else {
          await db.insert(reportCards).values({
            id: crypto.randomUUID(),
            establishmentId,
            studentId,
            periodId: input.periodId,
            classId: input.classId,
            average,
            status: "Brouillon",
            generatedAt,
          });
        }
        count += 1;
      }
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Génération des bulletins",
        target: input.classId,
        detail: `${count} bulletin(s)`,
      });
      return { count };
    }),

  validateReportCards: authed
    .input(
      z.object({
        periodId: z.string().trim().min(1).max(60),
        classId: z.string().trim().min(1).max(60),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(reportCards)
        .where(
          and(
            eq(reportCards.establishmentId, establishmentId),
            eq(reportCards.periodId, input.periodId),
            eq(reportCards.classId, input.classId),
          ),
        );
      if (!rows.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Générez les bulletins avant de les valider.",
        });
      }
      await db
        .update(reportCards)
        .set({ status: "Validé" })
        .where(
          and(
            eq(reportCards.establishmentId, establishmentId),
            eq(reportCards.periodId, input.periodId),
            eq(reportCards.classId, input.classId),
            eq(reportCards.status, "Brouillon"),
          ),
        );
      return { count: rows.length };
    }),

  publishReportCards: authed
    .input(
      z.object({
        periodId: z.string().trim().min(1).max(60),
        classId: z.string().trim().min(1).max(60),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(reportCards)
        .where(
          and(
            eq(reportCards.establishmentId, establishmentId),
            eq(reportCards.periodId, input.periodId),
            eq(reportCards.classId, input.classId),
          ),
        );
      if (!rows.length || rows.some((r) => r.status !== "Validé" && r.status !== "Publié")) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Tous les bulletins doivent être validés avant publication.",
        });
      }
      const publishedAt = new Date().toISOString().slice(0, 10);
      await db
        .update(reportCards)
        .set({ status: "Publié", publishedAt })
        .where(
          and(
            eq(reportCards.establishmentId, establishmentId),
            eq(reportCards.periodId, input.periodId),
            eq(reportCards.classId, input.classId),
          ),
        );
      for (const row of rows) {
        await logStudentHistory(
          establishmentId,
          row.studentId,
          "Publication du bulletin",
          row.periodId,
          context.user.name,
        );
      }
      const newlyPublished = rows.filter((row) => row.status !== "Publié");
      if (newlyPublished.length) {
        const studentIds = newlyPublished.map((row) => row.studentId);
        const userIds = await familyUserIdsForStudents(establishmentId, studentIds);
        await createNotifications({
          establishmentId,
          userIds,
          title: "Bulletins publiés",
          body: `${newlyPublished.length} bulletin(s) sont disponibles sur l’espace famille.`,
          category: "Pédagogie",
          link: "reports",
        });
      }
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Publication des bulletins",
        target: input.classId,
        detail: `${rows.length} bulletin(s)`,
      });
      return { count: rows.length };
    }),

  /** Contenu imprimable d’un bulletin (détail par matière), filtré selon le rôle. */
  reportCardContent: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(reportCards)
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const report = rows[0];
      if (!report) {
        throw new ORPCError("BAD_REQUEST", { message: "Bulletin introuvable." });
      }

      const family = context.user.role === "parent" || context.user.role === "student";
      if (family) {
        if (report.status !== "Publié") {
          throw new ORPCError("BAD_REQUEST", { message: "Ce bulletin n’est pas publié." });
        }
        let allowed = false;
        if (context.user.role === "student") {
          const me = await db
            .select({ id: students.id })
            .from(students)
            .where(
              and(
                eq(students.establishmentId, establishmentId),
                eq(students.userId, context.user.id),
                eq(students.id, report.studentId),
              ),
            )
            .limit(1);
          allowed = me.length > 0;
        } else {
          const guardianRows = await db
            .select({ id: guardians.id })
            .from(guardians)
            .where(
              and(
                eq(guardians.establishmentId, establishmentId),
                eq(guardians.userId, context.user.id),
              ),
            );
          if (guardianRows.length) {
            const links = await db
              .select({ studentId: studentGuardians.studentId })
              .from(studentGuardians)
              .where(
                and(
                  inArray(
                    studentGuardians.guardianId,
                    guardianRows.map((g) => g.id),
                  ),
                  eq(studentGuardians.studentId, report.studentId),
                ),
              )
              .limit(1);
            allowed = links.length > 0;
          }
        }
        if (!allowed) {
          throw new ORPCError("BAD_REQUEST", { message: "Bulletin introuvable." });
        }
      }

      const [schoolRows, studentRows, periodRows, classRows] = await Promise.all([
        db
          .select()
          .from(establishments)
          .where(eq(establishments.id, establishmentId))
          .limit(1),
        db
          .select()
          .from(students)
          .where(
            and(
              eq(students.id, report.studentId),
              eq(students.establishmentId, establishmentId),
            ),
          )
          .limit(1),
        db
          .select()
          .from(periods)
          .where(
            and(
              eq(periods.id, report.periodId),
              eq(periods.establishmentId, establishmentId),
            ),
          )
          .limit(1),
        report.classId
          ? db
              .select()
              .from(classes)
              .where(
                and(
                  eq(classes.id, report.classId),
                  eq(classes.establishmentId, establishmentId),
                ),
              )
              .limit(1)
          : Promise.resolve([]),
      ]);
      const school = schoolRows[0];
      const student = studentRows[0];
      const period = periodRows[0];
      const classe = classRows[0];
      if (!school || !student || !period) {
        throw new ORPCError("BAD_REQUEST", { message: "Données du bulletin incomplètes." });
      }
      const detail = await computeStudentReport(
        establishmentId,
        report.classId ?? classe?.id ?? "",
        report.periodId,
        report.studentId,
      );
      return {
        id: report.id,
        status: report.status,
        average: report.average,
        generatedAt: report.generatedAt,
        publishedAt: report.publishedAt,
        school: {
          name: school.name,
          email: school.email,
          phone: school.phone,
          address: school.address,
        },
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          reference: student.reference,
          birthDate: student.birthDate,
        },
        period: {
          id: period.id,
          name: period.name,
          startsOn: period.startsOn,
          endsOn: period.endsOn,
        },
        class: classe
          ? {
              id: classe.id,
              name: classe.name,
              level: classe.level,
              mainTeacher: classe.mainTeacher,
            }
          : null,
        subjects: detail.subjects,
      };
    }),
};

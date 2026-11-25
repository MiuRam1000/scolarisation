import { ORPCError } from "@orpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  academicYears,
  establishments,
  periods,
  rooms,
  subjects,
  subjectProgramDocuments,
} from "../database/schema";
import { authed, MANAGE_ROLES, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { tenantOf } from "./scolarite-helpers";

const statusField = z.string().trim().min(1).max(40);
const dateField = z.string().trim().max(20).default("");

const yearInput = z.object({
  label: z.string().trim().min(4).max(40),
  startsOn: dateField,
  endsOn: dateField,
  status: statusField.default("Active"),
});

const periodInput = z.object({
  academicYearId: z.string().trim().max(60).optional(),
  academicYearLabel: z.string().trim().max(40).optional(),
  name: z.string().trim().min(1).max(60),
  startsOn: dateField,
  endsOn: dateField,
  gradesDeadline: dateField,
  status: statusField.default("Planifiée"),
});

const subjectInput = z.object({
  name: z.string().trim().min(1).max(80),
  level: z.string().trim().max(60).default(""),
  program: z.string().trim().max(120).default(""),
  coefficient: z.number().int().min(1).max(20).default(1),
  weeklyHours: z.number().int().min(0).max(40).default(0),
  status: statusField.default("Actif"),
});

const roomInput = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.string().trim().max(40).default("Salle de cours"),
  capacity: z.number().int().min(1).max(500).default(30),
  equipment: z.string().trim().max(160).default(""),
  building: z.string().trim().max(80).default(""),
  status: statusField.default("Disponible"),
});

const settingsInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(190).or(z.literal("")).default(""),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(240).default(""),
  currency: z.string().trim().max(40).default("EUR — Euro"),
  periodType: z.string().trim().max(40).default("Trimestres"),
  rounding: z.string().trim().max(40).default("2 décimales"),
});

async function findYear(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.id, id), eq(academicYears.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Année scolaire inconnue." });
  return rows[0];
}

async function findPeriod(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(periods)
    .where(and(eq(periods.id, id), eq(periods.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Période inconnue." });
  return rows[0];
}

async function findSubject(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Matière inconnue." });
  return rows[0];
}

async function findRoom(establishmentId: string, id: string) {
  const rows = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, id), eq(rooms.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Salle inconnue." });
  return rows[0];
}

export const referentiel = {
  /** Référentiels de l'établissement : années, périodes, matières, salles, paramètres. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) {
      return {
        academicYears: [],
        periods: [],
        subjects: [],
        rooms: [],
        programDocuments: [],
        settings: null,
      };
    }
    const [yearRows, periodRows, subjectRows, roomRows, programDocRows, settingRows] =
      await Promise.all([
      db
        .select()
        .from(academicYears)
        .where(eq(academicYears.establishmentId, establishmentId))
        .orderBy(asc(academicYears.startsOn)),
      db
        .select()
        .from(periods)
        .where(eq(periods.establishmentId, establishmentId))
        .orderBy(asc(periods.startsOn)),
      db
        .select()
        .from(subjects)
        .where(eq(subjects.establishmentId, establishmentId))
        .orderBy(asc(subjects.name)),
      db.select().from(rooms).where(eq(rooms.establishmentId, establishmentId)).orderBy(asc(rooms.name)),
      db
        .select({
          id: subjectProgramDocuments.id,
          subjectId: subjectProgramDocuments.subjectId,
          fileName: subjectProgramDocuments.fileName,
          mimeType: subjectProgramDocuments.mimeType,
          size: subjectProgramDocuments.size,
          uploadedBy: subjectProgramDocuments.uploadedBy,
          createdAt: subjectProgramDocuments.createdAt,
        })
        .from(subjectProgramDocuments)
        .where(eq(subjectProgramDocuments.establishmentId, establishmentId))
        .orderBy(asc(subjectProgramDocuments.createdAt)),
      db.select().from(establishments).where(eq(establishments.id, establishmentId)).limit(1),
    ]);
    const yearById = new Map(yearRows.map((y) => [y.id, y.label]));
    const settings = settingRows[0];
    return {
      academicYears: yearRows,
      periods: periodRows.map((p) => ({
        ...p,
        academicYearLabel: yearById.get(p.academicYearId) ?? "",
      })),
      subjects: subjectRows,
      rooms: roomRows,
      programDocuments: programDocRows,
      settings: settings
        ? {
            name: settings.name,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
            currency: settings.currency,
            periodType: settings.periodType,
            rounding: settings.rounding,
          }
        : null,
    };
  }),

  createYear: authed.input(yearInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const existing = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.establishmentId, establishmentId),
          eq(academicYears.label, input.label),
        ),
      )
      .limit(1);
    if (existing.length) {
      throw new ORPCError("BAD_REQUEST", { message: "Cette année scolaire existe déjà." });
    }
    const id = crypto.randomUUID();
    await db.insert(academicYears).values({ id, establishmentId, ...input });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’une année scolaire",
      target: input.label,
    });
    return { id };
  }),

  updateYear: authed
    .input(yearInput.extend({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findYear(establishmentId, input.id);
      await db
        .update(academicYears)
        .set({
          label: input.label,
          startsOn: input.startsOn,
          endsOn: input.endsOn,
          status: input.status,
        })
        .where(eq(academicYears.id, input.id));
      return { id: input.id };
    }),

  removeYear: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findYear(establishmentId, input.id);
      await db.delete(academicYears).where(eq(academicYears.id, input.id));
      return { id: input.id };
    }),

  createPeriod: authed.input(periodInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    let academicYearId = input.academicYearId ?? "";
    if (academicYearId) {
      await findYear(establishmentId, academicYearId);
    } else {
      const label = input.academicYearLabel?.trim() || "Année en cours";
      const found = await db
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(
          and(
            eq(academicYears.establishmentId, establishmentId),
            eq(academicYears.label, label),
          ),
        )
        .limit(1);
      if (found.length) {
        academicYearId = found[0].id;
      } else {
        academicYearId = crypto.randomUUID();
        await db.insert(academicYears).values({
          id: academicYearId,
          establishmentId,
          label,
          startsOn: input.startsOn,
          endsOn: input.endsOn,
          status: "Active",
        });
      }
    }
    const id = crypto.randomUUID();
    await db.insert(periods).values({
      id,
      establishmentId,
      academicYearId,
      name: input.name,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      gradesDeadline: input.gradesDeadline,
      status: input.status,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’une période",
      target: input.name,
      detail: input.academicYearLabel ?? "",
    });
    return { id };
  }),

  updatePeriod: authed
    .input(periodInput.extend({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const current = await findPeriod(establishmentId, input.id);
      let academicYearId = current.academicYearId;
      if (input.academicYearId) {
        await findYear(establishmentId, input.academicYearId);
        academicYearId = input.academicYearId;
      }
      await db
        .update(periods)
        .set({
          academicYearId,
          name: input.name,
          startsOn: input.startsOn,
          endsOn: input.endsOn,
          gradesDeadline: input.gradesDeadline,
          status: input.status,
        })
        .where(eq(periods.id, input.id));
      return { id: input.id };
    }),

  removePeriod: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findPeriod(establishmentId, input.id);
      await db.delete(periods).where(eq(periods.id, input.id));
      return { id: input.id };
    }),

  createSubject: authed.input(subjectInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const existing = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(
        and(
          eq(subjects.establishmentId, establishmentId),
          eq(subjects.name, input.name),
          eq(subjects.level, input.level),
          eq(subjects.program, input.program),
        ),
      )
      .limit(1);
    if (existing.length) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cette matière existe déjà pour ce niveau et ce programme.",
      });
    }
    const id = crypto.randomUUID();
    await db.insert(subjects).values({ id, establishmentId, ...input });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’une matière",
      target: input.name,
      detail: [input.level, input.program].filter(Boolean).join(" · "),
    });
    return { id };
  }),

  updateSubject: authed
    .input(subjectInput.extend({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findSubject(establishmentId, input.id);
      const duplicate = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(
          and(
            eq(subjects.establishmentId, establishmentId),
            eq(subjects.name, input.name),
            eq(subjects.level, input.level),
            eq(subjects.program, input.program),
            ne(subjects.id, input.id),
          ),
        )
        .limit(1);
      if (duplicate.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cette matière existe déjà pour ce niveau et ce programme.",
        });
      }
      await db
        .update(subjects)
        .set({
          name: input.name,
          level: input.level,
          program: input.program,
          coefficient: input.coefficient,
          weeklyHours: input.weeklyHours,
          status: input.status,
        })
        .where(eq(subjects.id, input.id));
      return { id: input.id };
    }),

  removeSubject: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findSubject(establishmentId, input.id);
      await db.delete(subjects).where(eq(subjects.id, input.id));
      return { id: input.id };
    }),

  createRoom: authed.input(roomInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const id = crypto.randomUUID();
    await db.insert(rooms).values({ id, establishmentId, ...input });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’une salle",
      target: input.name,
      detail: input.building,
    });
    return { id };
  }),

  updateRoom: authed
    .input(roomInput.extend({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findRoom(establishmentId, input.id);
      await db
        .update(rooms)
        .set({
          name: input.name,
          type: input.type,
          capacity: input.capacity,
          equipment: input.equipment,
          building: input.building,
          status: input.status,
        })
        .where(eq(rooms.id, input.id));
      return { id: input.id };
    }),

  removeRoom: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      await findRoom(establishmentId, input.id);
      await db.delete(rooms).where(eq(rooms.id, input.id));
      return { id: input.id };
    }),

  updateSettings: authed.input(settingsInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    await db.update(establishments).set(input).where(eq(establishments.id, establishmentId));
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Mise à jour des paramètres de l’établissement",
      target: input.name,
    });
    return { id: establishmentId };
  }),
};

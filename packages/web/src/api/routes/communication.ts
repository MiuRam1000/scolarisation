import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  announcements,
  classes,
  guardians,
  studentGuardians,
  students,
} from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { notifyAnnouncement } from "./notifications";
import { tenantOf } from "./scolarite-helpers";

const READ_ROLES = [
  "direction",
  "administration",
  "teacher",
  "supervisor",
  "accountant",
  "parent",
  "student",
] as const;
const MANAGE_ROLES = ["direction", "administration"] as const;
const AUDIENCES = [
  "Tous",
  "Parents",
  "Élèves",
  "Enseignants",
  "Personnel",
  "Classe",
] as const;

const announcementInput = z.object({
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(3).max(4000),
  audience: z.enum(AUDIENCES).default("Tous"),
  classId: z.string().trim().max(60).default(""),
});

async function familyClassIds(establishmentId: string, userId: string, role: string) {
  let studentIds: string[] = [];
  if (role === "student") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(eq(students.establishmentId, establishmentId), eq(students.userId, userId)),
      );
    studentIds = rows.map((row) => row.id);
  } else {
    const linkedGuardians = await db
      .select({ id: guardians.id })
      .from(guardians)
      .where(
        and(eq(guardians.establishmentId, establishmentId), eq(guardians.userId, userId)),
      );
    if (linkedGuardians.length) {
      const links = await db
        .select({ studentId: studentGuardians.studentId })
        .from(studentGuardians)
        .where(
          inArray(
            studentGuardians.guardianId,
            linkedGuardians.map((row) => row.id),
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
      and(
        eq(students.establishmentId, establishmentId),
        inArray(students.id, studentIds),
      ),
    );
  return [...new Set(rows.map((row) => row.classId).filter(Boolean))] as string[];
}

function visibleToFamily(
  announcement: {
    audience: string;
    classId: string | null;
  },
  role: string,
  classIds: string[],
) {
  if (announcement.audience === "Tous") return true;
  if (role === "student" && announcement.audience === "Élèves") return true;
  if (role === "parent" && announcement.audience === "Parents") return true;
  return (
    announcement.audience === "Classe" &&
    Boolean(announcement.classId) &&
    classIds.includes(announcement.classId ?? "")
  );
}

export const communication = {
  /** Annonces visibles selon le rôle et les classes des enfants. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...READ_ROLES]);
    const establishmentId = tenantOf(context);
    const manager = ["direction", "administration"].includes(context.user.role);
    const family = ["parent", "student"].includes(context.user.role);
    const familyClasses = family
      ? await familyClassIds(establishmentId, context.user.id, context.user.role)
      : [];
    const [classRows, rows] = await Promise.all([
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
      db
        .select()
        .from(announcements)
        .where(eq(announcements.establishmentId, establishmentId))
        .orderBy(desc(announcements.createdAt)),
    ]);
    const classById = new Map(classRows.map((row) => [row.id, row]));
    const visibleRows = manager
      ? rows
      : family
        ? rows.filter(
            (row) =>
              row.status === "Publié" &&
              visibleToFamily(row, context.user.role, familyClasses),
          )
        : rows.filter((row) => row.status === "Publié");
    const items = visibleRows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      audience: row.audience,
      classId: row.classId ?? "",
      className: row.classId ? classById.get(row.classId)?.name ?? "" : "",
      status: row.status,
      createdByName: row.createdByName,
      publishedAt: row.publishedAt,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
    return {
      announcements: items,
      classes: manager
        ? classRows.map((row) => ({ id: row.id, name: row.name }))
        : [],
      canManage: manager,
      stats: {
        total: items.length,
        published: items.filter((item) => item.status === "Publié").length,
        drafts: items.filter((item) => item.status === "Brouillon").length,
        archived: items.filter((item) => item.status === "Archivé").length,
      },
    };
  }),

  create: authed.input(announcementInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...MANAGE_ROLES]);
    const establishmentId = tenantOf(context);
    let classId: string | null = null;
    if (input.audience === "Classe") {
      if (!input.classId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Sélectionnez la classe destinataire.",
        });
      }
      const rows = await db
        .select({ id: classes.id })
        .from(classes)
        .where(
          and(
            eq(classes.id, input.classId),
            eq(classes.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      if (!rows.length) {
        throw new ORPCError("BAD_REQUEST", { message: "Classe inconnue." });
      }
      classId = input.classId;
    }
    const id = crypto.randomUUID();
    await db.insert(announcements).values({
      id,
      establishmentId,
      title: input.title,
      body: input.body,
      audience: input.audience,
      classId,
      status: "Brouillon",
      createdByUserId: context.user.id,
      createdByName: context.user.name,
      updatedAt: new Date().toISOString(),
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création d’une annonce",
      target: input.title,
      detail: `Audience : ${input.audience}`,
    });
    return { id };
  }),

  publish: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, [...MANAGE_ROLES]);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(announcements)
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const announcement = rows[0];
      if (!announcement) {
        throw new ORPCError("BAD_REQUEST", { message: "Annonce inconnue." });
      }
      if (announcement.status === "Archivé") {
        throw new ORPCError("BAD_REQUEST", { message: "Cette annonce est archivée." });
      }
      await db
        .update(announcements)
        .set({
          status: "Publié",
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(announcements.id, announcement.id));
      const notified = await notifyAnnouncement({
        establishmentId,
        announcementId: announcement.id,
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        classId: announcement.classId ?? "",
      });
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Publication d'une annonce",
        target: announcement.title,
        detail: `${notified} notification(s) interne(s)`,
      });
      return { id: announcement.id, notified };
    }),

  archive: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, [...MANAGE_ROLES]);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(announcements)
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const announcement = rows[0];
      if (!announcement) {
        throw new ORPCError("BAD_REQUEST", { message: "Annonce inconnue." });
      }
      await db
        .update(announcements)
        .set({ status: "Archivé", updatedAt: new Date().toISOString() })
        .where(eq(announcements.id, announcement.id));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Archivage d’une annonce",
        target: announcement.title,
      });
      return { id: announcement.id };
    }),
};

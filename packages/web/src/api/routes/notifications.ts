import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  guardians,
  notifications,
  studentGuardians,
  students,
  users,
} from "../database/schema";
import { authed } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { tenantOf } from "./scolarite-helpers";

const STAFF_NOTIFICATION_ROLES = [
  "direction",
  "administration",
  "teacher",
  "supervisor",
  "accountant",
] as const;

const READ_ROLES = [
  "direction",
  "administration",
  "teacher",
  "supervisor",
  "accountant",
  "parent",
  "student",
] as const;

async function classFamilyUserIds(establishmentId: string, classId: string) {
  const studentRows = await db
    .select({ id: students.id, userId: students.userId })
    .from(students)
    .where(and(eq(students.establishmentId, establishmentId), eq(students.classId, classId)));
  if (!studentRows.length) return [] as string[];
  const ids = studentRows.map((row) => row.id);
  const guardianRows = await db
    .select({ userId: guardians.userId })
    .from(guardians)
    .innerJoin(studentGuardians, eq(studentGuardians.guardianId, guardians.id))
    .where(
      and(
        eq(guardians.establishmentId, establishmentId),
        inArray(studentGuardians.studentId, ids),
      ),
    );
  return [
    ...new Set([
      ...studentRows.map((row) => row.userId).filter((id): id is string => Boolean(id)),
      ...guardianRows.map((row) => row.userId).filter((id): id is string => Boolean(id)),
    ]),
  ];
}

/** Comptes utilisateurs (élève + responsables liés) rattachés à une liste d'élèves. */
export async function familyUserIdsForStudents(
  establishmentId: string,
  studentIds: string[],
) {
  if (!studentIds.length) return [] as string[];
  const [studentRows, guardianRows] = await Promise.all([
    db
      .select({ userId: students.userId })
      .from(students)
      .where(
        and(eq(students.establishmentId, establishmentId), inArray(students.id, studentIds)),
      ),
    db
      .select({ userId: guardians.userId })
      .from(guardians)
      .innerJoin(studentGuardians, eq(studentGuardians.guardianId, guardians.id))
      .where(
        and(
          eq(guardians.establishmentId, establishmentId),
          inArray(studentGuardians.studentId, studentIds),
        ),
      ),
  ]);
  return [
    ...new Set([
      ...studentRows.map((row) => row.userId).filter((id): id is string => Boolean(id)),
      ...guardianRows.map((row) => row.userId).filter((id): id is string => Boolean(id)),
    ]),
  ];
}

/** Crée des notifications internes pour une liste de comptes (dédoublonnée). */
export async function createNotifications(input: {
  establishmentId: string;
  userIds: string[];
  title: string;
  body: string;
  category: string;
  link: string;
  announcementId?: string;
}) {
  const userIds = [...new Set(input.userIds)];
  if (!userIds.length) return 0;
  const body = input.body.length > 240 ? `${input.body.slice(0, 237)}…` : input.body;
  await db.insert(notifications).values(
    userIds.map((userId) => ({
      id: crypto.randomUUID(),
      establishmentId: input.establishmentId,
      userId,
      title: input.title,
      body,
      category: input.category,
      link: input.link,
      announcementId: input.announcementId ?? null,
    })),
  );
  return userIds.length;
}

async function audienceUserIds(
  establishmentId: string,
  audience: string,
  classId: string,
) {
  if (audience === "Tous") {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.establishmentId, establishmentId));
    return rows.map((row) => row.id);
  }
  if (audience === "Parents" || audience === "Élèves") {
    const role = audience === "Parents" ? "parent" : "student";
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.establishmentId, establishmentId), eq(users.role, role)));
    return rows.map((row) => row.id);
  }
  if (audience === "Enseignants") {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.establishmentId, establishmentId), eq(users.role, "teacher")));
    return rows.map((row) => row.id);
  }
  if (audience === "Personnel") {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.establishmentId, establishmentId),
          inArray(users.role, [...STAFF_NOTIFICATION_ROLES]),
        ),
      );
    return rows.map((row) => row.id);
  }
  if (audience === "Classe" && classId) {
    return classFamilyUserIds(establishmentId, classId);
  }
  return [] as string[];
}

/** Crée une notification interne pour chaque destinataire d'une annonce publiée. */
export async function notifyAnnouncement(input: {
  establishmentId: string;
  announcementId: string;
  title: string;
  body: string;
  audience: string;
  classId: string;
}) {
  const userIds = await audienceUserIds(
    input.establishmentId,
    input.audience,
    input.classId,
  );
  return createNotifications({
    establishmentId: input.establishmentId,
    userIds,
    title: input.title,
    body: input.body,
    category: "Annonce",
    link: "messages",
    announcementId: input.announcementId,
  });
}

export const notificationsApi = {
  /** Notifications de l'utilisateur connecté. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    if (!READ_ROLES.includes(context.user.role as (typeof READ_ROLES)[number])) {
      return { notifications: [], unreadCount: 0 };
    }
    const establishmentId = context.user.establishmentId;
    if (!establishmentId) return { notifications: [], unreadCount: 0 };
    const [rows, unread] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.establishmentId, establishmentId),
            eq(notifications.userId, context.user.id),
          ),
        )
        .orderBy(desc(notifications.createdAt))
        .limit(50),
      db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.establishmentId, establishmentId),
            eq(notifications.userId, context.user.id),
            eq(notifications.readAt, ""),
          ),
        ),
    ]);
    return {
      notifications: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        category: row.category,
        link: row.link,
        readAt: row.readAt,
        createdAt: row.createdAt,
      })),
      unreadCount: unread.length,
    };
  }),

  /** Marque une notification comme lue. */
  markRead: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select({ id: notifications.id, readAt: notifications.readAt })
        .from(notifications)
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.establishmentId, establishmentId),
            eq(notifications.userId, context.user.id),
          ),
        )
        .limit(1);
      const notification = rows[0];
      if (!notification) return { id: input.id };
      if (!notification.readAt) {
        await db
          .update(notifications)
          .set({ readAt: new Date().toISOString() })
          .where(eq(notifications.id, notification.id));
      }
      return { id: notification.id };
    }),

  /** Marque toutes les notifications de l'utilisateur comme lues. */
  markAllRead: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    const establishmentId = tenantOf(context);
    await db
      .update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(
        and(
          eq(notifications.establishmentId, establishmentId),
          eq(notifications.userId, context.user.id),
          eq(notifications.readAt, ""),
        ),
      );
    return { ok: true };
  }),
};

import { ORPCError } from "@orpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { subjects, subjectProgramDocuments } from "../database/schema";
import { authed, MANAGE_ROLES, requireRole, STAFF_ROLES } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { MAX_DOCUMENT_BYTES, tenantOf } from "./scolarite-helpers";

async function subjectOf(establishmentId: string, subjectId: string) {
  const rows = await db
    .select({ id: subjects.id, name: subjects.name, level: subjects.level })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Matière inconnue." });
  return rows[0];
}

/** Programme d'une matière : un fichier stocké en base, remplaçable à chaque import. */
export const subjectDocumentsApi = {
  upload: authed
    .input(
      z.object({
        subjectId: z.string().trim().min(1).max(60),
        fileName: z.string().trim().min(1).max(190),
        mimeType: z.string().trim().max(120).default(""),
        size: z.number().int().min(0).max(MAX_DOCUMENT_BYTES),
        content: z.string().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const subject = await subjectOf(establishmentId, input.subjectId);
      const duplicate = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(
          and(
            eq(subjects.establishmentId, establishmentId),
            eq(subjects.name, subject.name),
            eq(subjects.level, subject.level),
            eq(subjects.program, input.fileName),
            ne(subjects.id, subject.id),
          ),
        )
        .limit(1);
      if (duplicate.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Une matière existe déjà avec ce niveau et ce nom de programme.",
        });
      }

      await db
        .delete(subjectProgramDocuments)
        .where(
          and(
            eq(subjectProgramDocuments.establishmentId, establishmentId),
            eq(subjectProgramDocuments.subjectId, subject.id),
          ),
        );
      const id = crypto.randomUUID();
      await db.insert(subjectProgramDocuments).values({
        id,
        establishmentId,
        subjectId: subject.id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.size,
        content: input.content,
        uploadedBy: context.user.name,
      });
      await db
        .update(subjects)
        .set({ program: input.fileName })
        .where(eq(subjects.id, subject.id));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Import du programme d’une matière",
        target: subject.name,
        detail: input.fileName,
      });
      return { id };
    }),

  content: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, STAFF_ROLES);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(subjectProgramDocuments)
        .where(
          and(
            eq(subjectProgramDocuments.id, input.id),
            eq(subjectProgramDocuments.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const doc = rows[0];
      if (!doc) throw new ORPCError("NOT_FOUND", { message: "Programme introuvable." });
      return {
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        content: doc.content,
      };
    }),

  remove: authed
    .input(z.object({ id: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select({
          id: subjectProgramDocuments.id,
          fileName: subjectProgramDocuments.fileName,
          subjectId: subjectProgramDocuments.subjectId,
        })
        .from(subjectProgramDocuments)
        .where(
          and(
            eq(subjectProgramDocuments.id, input.id),
            eq(subjectProgramDocuments.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const doc = rows[0];
      if (!doc) throw new ORPCError("NOT_FOUND", { message: "Programme introuvable." });
      const subject = await subjectOf(establishmentId, doc.subjectId);
      await db.delete(subjectProgramDocuments).where(eq(subjectProgramDocuments.id, doc.id));
      await db.update(subjects).set({ program: "" }).where(eq(subjects.id, doc.subjectId));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Suppression du programme d’une matière",
        target: subject.name,
        detail: doc.fileName,
      });
      return { id: doc.id };
    }),
};

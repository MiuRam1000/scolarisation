import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { studentDocuments, students } from "../database/schema";
import { authed, MANAGE_ROLES, requireRole, STAFF_ROLES } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import {
  documentKindField,
  logStudentHistory,
  MAX_DOCUMENT_BYTES,
  tenantOf,
} from "./scolarite-helpers";

async function studentOf(establishmentId: string, studentId: string) {
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.establishmentId, establishmentId)))
    .limit(1);
  if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Dossier élève inconnu." });
  return rows[0];
}

/** Pièces jointes : import, consultation et suppression. */
export const studentDocumentsApi = {
  upload: authed
    .input(
      z.object({
        studentId: z.string().trim().min(1).max(60),
        kind: documentKindField,
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
      await studentOf(establishmentId, input.studentId);

      const id = crypto.randomUUID();
      await db.insert(studentDocuments).values({
        id,
        establishmentId,
        studentId: input.studentId,
        kind: input.kind,
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.size,
        content: input.content,
        uploadedBy: context.user.name,
      });
      const label =
        input.kind === "photo"
          ? "Photo de l’élève"
          : input.kind === "birth_certificate"
            ? "Acte de naissance"
            : input.kind === "transfer_certificate"
              ? "Certificat de transfert"
              : "Pièce jointe";
      await logStudentHistory(
        establishmentId,
        input.studentId,
        "Ajout d’une pièce",
        `${label} · ${input.fileName}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Import d’une pièce jointe",
        target: input.studentId,
        detail: `${label} · ${input.fileName}`,
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
        .from(studentDocuments)
        .where(
          and(
            eq(studentDocuments.id, input.id),
            eq(studentDocuments.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const doc = rows[0];
      if (!doc) throw new ORPCError("NOT_FOUND", { message: "Pièce jointe introuvable." });
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
        .select()
        .from(studentDocuments)
        .where(
          and(
            eq(studentDocuments.id, input.id),
            eq(studentDocuments.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const doc = rows[0];
      if (!doc) throw new ORPCError("NOT_FOUND", { message: "Pièce jointe introuvable." });
      await db.delete(studentDocuments).where(eq(studentDocuments.id, doc.id));
      await logStudentHistory(
        establishmentId,
        doc.studentId,
        "Suppression d’une pièce",
        doc.fileName,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Suppression d’une pièce jointe",
        target: doc.studentId,
        detail: doc.fileName,
      });
      return { id: doc.id };
    }),

  list: authed
    .input(z.object({ studentId: z.string().trim().min(1).max(60) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, STAFF_ROLES);
      const establishmentId = tenantOf(context);
      await studentOf(establishmentId, input.studentId);
      return db
        .select({
          id: studentDocuments.id,
          kind: studentDocuments.kind,
          fileName: studentDocuments.fileName,
          mimeType: studentDocuments.mimeType,
          size: studentDocuments.size,
          uploadedBy: studentDocuments.uploadedBy,
          createdAt: studentDocuments.createdAt,
        })
        .from(studentDocuments)
        .where(eq(studentDocuments.studentId, input.studentId))
        .orderBy(desc(studentDocuments.createdAt));
    }),
};

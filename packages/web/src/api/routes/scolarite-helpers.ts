import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "../database";
import { studentHistory } from "../database/schema";

/** Statuts autorisés pour un dossier élève. */
export const STUDENT_STATUS_VALUES = [
  "En attente de validation",
  "Inscrit",
  "Actif",
  "Transféré",
  "Sorti",
  "Suspendu",
  "Archivé",
  "Désinscrit",
] as const;

export type StudentStatus = (typeof STUDENT_STATUS_VALUES)[number];

export const studentStatusField = z.enum(STUDENT_STATUS_VALUES);

/** Types de pièces jointes acceptés. */
export const DOCUMENT_KINDS = [
  "photo",
  "birth_certificate",
  "transfer_certificate",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const documentKindField = z.enum(DOCUMENT_KINDS);

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export function tenantOf(context: {
  user: { establishmentId: string | null };
  establishment: unknown;
}) {
  const id = context.user.establishmentId;
  if (!id) throw new ORPCError("BAD_REQUEST", { message: "Aucun établissement associé." });
  return id;
}

export async function logStudentHistory(
  establishmentId: string,
  studentId: string,
  action: string,
  detail: string,
  actor: string,
) {
  await db.insert(studentHistory).values({
    id: crypto.randomUUID(),
    establishmentId,
    studentId,
    action,
    detail,
    actor,
  });
}

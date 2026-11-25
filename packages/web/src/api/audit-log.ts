import { db } from "./database";
import { auditLogs } from "./database/schema";

/** Écrit une entrée dans le journal d'audit global. Ne doit jamais bloquer l'action métier. */
export async function logAudit(entry: {
  establishmentId?: string | null;
  userId?: string | null;
  actor?: string;
  action: string;
  target?: string;
  detail?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      establishmentId: entry.establishmentId ?? null,
      userId: entry.userId ?? null,
      actor: entry.actor ?? "",
      action: entry.action,
      target: entry.target ?? "",
      detail: entry.detail ?? "",
    });
  } catch {
    // Le journal ne doit pas casser une opération utilisateur.
  }
}

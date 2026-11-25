import { ORPCError } from "@orpc/server";
import type { Role } from "../database/schema";
import { base } from "../__core/app";
import { currentSession } from "./session";

/** Procédure exigeant une session valide. Ajoute `user` et `establishment`. */
export const authed = base.use(async ({ context, next }) => {
  const session = await currentSession(context.headers);
  if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Connexion requise." });
  return next({
    context: { ...context, user: session.user, establishment: session.establishment },
  });
});

/** Rôles autorisés à lire l'ensemble des dossiers de l'établissement. */
export const STAFF_ROLES: Role[] = [
  "direction",
  "administration",
  "teacher",
  "supervisor",
  "accountant",
];

/** Rôles autorisés à créer ou modifier des dossiers. */
export const MANAGE_ROLES: Role[] = ["direction", "administration"];

export function requireRole(role: string, allowed: Role[]) {
  if (!allowed.includes(role as Role)) {
    throw new ORPCError("FORBIDDEN", {
      message: "Votre rôle ne permet pas cette action.",
    });
  }
}

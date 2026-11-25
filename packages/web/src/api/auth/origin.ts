import { ORPCError } from "@orpc/server";

/**
 * Protection CSRF de base : les requêtes authentifiées par cookie ne sont
 * acceptées que depuis le même hôte ou depuis WEBSITE_URL.
 * Les appels sans en-tête Origin (curl, tests, appels serveur) restent permis.
 */
export function assertTrustedOrigin(headers: Headers) {
  const origin = headers.get("origin");
  if (!origin) return;
  const allowed = new Set<string>();
  const configured = process.env.WEBSITE_URL;
  if (configured) {
    try {
      allowed.add(new URL(configured).origin);
    } catch {
      // URL mal configurée : on ignore.
    }
  }
  const host = headers.get("host");
  if (host) allowed.add(`https://${host}`), allowed.add(`http://${host}`);
  if (!allowed.has(origin)) {
    throw new ORPCError("FORBIDDEN", { message: "Origine de la requête non autorisée." });
  }
}

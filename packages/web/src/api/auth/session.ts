import { and, eq, gt } from "drizzle-orm";
import { db } from "../database";
import { establishments, sessions, users } from "../database/schema";

export const SESSION_COOKIE = "scolia_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Crée une session serveur ; le jeton en clair n'existe que dans le cookie. */
export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await db.insert(sessions).values({ id: await hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function revokeSession(token: string) {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.id, await hashToken(token)));
}

function readCookie(header: string | null, name: string) {
  if (!header) return "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function sessionTokenFromHeaders(headers: Headers) {
  return readCookie(headers.get("cookie"), SESSION_COOKIE);
}

export async function currentSession(headers: Headers) {
  const token = sessionTokenFromHeaders(headers);
  if (!token) return null;
  const rows = await db
    .select({ user: users, establishment: establishments })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(establishments, eq(establishments.id, users.establishmentId))
    .where(and(eq(sessions.id, await hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  return row ? { user: row.user, establishment: row.establishment } : null;
}

/** Données utilisateur exposées au client (jamais le hachage). */
export function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    establishmentId: user.establishmentId,
  };
}

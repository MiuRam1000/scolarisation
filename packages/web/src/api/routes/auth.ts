import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { establishments, users, academicYears, periods } from "../database/schema";
import { assertTrustedOrigin } from "../auth/origin";
import { hashPassword, verifyPassword } from "../auth/password";
import {
  createSession,
  currentSession,
  publicUser,
  revokeSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "../auth/session";
import { logAudit } from "../audit-log";

const isProduction = () => process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax" as const,
  path: "/",
  secure: isProduction(),
  maxAge: SESSION_TTL_SECONDS,
};

const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
type LoginAttempt = { count: number; windowStart: number; lockedUntil: number };
const loginAttempts = new Map<string, LoginAttempt>();

function loginThrottleKey(email: string) {
  return email.trim().toLowerCase();
}

function checkLoginThrottle(email: string) {
  const key = loginThrottleKey(email);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) return { allowed: true as const, retryAfterMs: 0 };
  if (entry.lockedUntil > now) {
    return { allowed: false as const, retryAfterMs: entry.lockedUntil - now };
  }
  if (now - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true as const, retryAfterMs: 0 };
  }
  return { allowed: true as const, retryAfterMs: 0 };
}

function recordLoginFailure(email: string) {
  const key = loginThrottleKey(email);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, windowStart: now, lockedUntil: 0 });
    return;
  }
  entry.count += 1;
  if (entry.count >= LOGIN_MAX_FAILURES) {
    entry.lockedUntil = now + LOGIN_LOCK_MS;
  }
}

function clearLoginFailures(email: string) {
  loginAttempts.delete(loginThrottleKey(email));
}

const registerSchema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(8).max(200),
  address: z.string().trim().max(200).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(1).max(200),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "etablissement";

async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = await db
      .select({ id: establishments.id })
      .from(establishments)
      .where(eq(establishments.slug, candidate))
      .limit(1);
    if (!existing.length) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function sessionPayload(userId: string) {
  const rows = await db
    .select({ user: users, establishment: establishments })
    .from(users)
    .leftJoin(establishments, eq(establishments.id, users.establishmentId))
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    user: publicUser(row.user),
    establishment: row.establishment
      ? {
          id: row.establishment.id,
          name: row.establishment.name,
          slug: row.establishment.slug,
          email: row.establishment.email,
          phone: row.establishment.phone,
          address: row.establishment.address,
          currency: row.establishment.currency,
        }
      : null,
  };
}

export const authRoutes = new Hono();

/** Inscription : crée l'établissement et son compte Direction (propriétaire). */
authRoutes.post("/register", async (c) => {
  try {
    assertTrustedOrigin(c.req.raw.headers);
  } catch {
    return c.json({ error: "Origine de la requête non autorisée." }, 403);
  }
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Informations incomplètes ou invalides." }, 400);
  }
  const { schoolName, name, email, password, address } = parsed.data;
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length) {
    return c.json({ error: "Un compte existe déjà avec cette adresse." }, 409);
  }
  const establishmentId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const slug = await uniqueSlug(schoolName);
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const yearId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(establishments).values({
      id: establishmentId,
      name: schoolName,
      slug,
      address: address ?? "",
      email,
    });
    await tx.insert(users).values({
      id: userId,
      establishmentId,
      email,
      name,
      role: "direction",
      passwordHash,
    });
    await tx.insert(academicYears).values({
      id: yearId,
      establishmentId,
      label: `${startYear}–${startYear + 1}`,
      startsOn: `${startYear}-09-01`,
      endsOn: `${startYear + 1}-07-02`,
      status: "Active",
    });
    await tx.insert(periods).values([
      {
        id: crypto.randomUUID(),
        establishmentId,
        academicYearId: yearId,
        name: "Premier trimestre",
        startsOn: `${startYear}-09-01`,
        endsOn: `${startYear}-12-18`,
        gradesDeadline: `${startYear}-12-12`,
        status: "En cours",
      },
      {
        id: crypto.randomUUID(),
        establishmentId,
        academicYearId: yearId,
        name: "Deuxième trimestre",
        startsOn: `${startYear + 1}-01-04`,
        endsOn: `${startYear + 1}-03-26`,
        gradesDeadline: `${startYear + 1}-03-20`,
        status: "Planifiée",
      },
      {
        id: crypto.randomUUID(),
        establishmentId,
        academicYearId: yearId,
        name: "Troisième trimestre",
        startsOn: `${startYear + 1}-04-12`,
        endsOn: `${startYear + 1}-07-02`,
        gradesDeadline: `${startYear + 1}-06-26`,
        status: "Planifiée",
      },
    ]);
  });
  const { token } = await createSession(userId);
  setCookie(c, SESSION_COOKIE, token, cookieOptions);
  await logAudit({
    establishmentId,
    userId,
    actor: name,
    action: "Création de l’établissement",
    target: schoolName,
    detail: email,
  });
  return c.json(await sessionPayload(userId), 201);
});

authRoutes.post("/login", async (c) => {
  try {
    assertTrustedOrigin(c.req.raw.headers);
  } catch {
    return c.json({ error: "Origine de la requête non autorisée." }, 403);
  }
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Adresse ou mot de passe invalide." }, 400);

  const throttle = checkLoginThrottle(parsed.data.email);
  if (!throttle.allowed) {
    const minutes = Math.max(1, Math.ceil(throttle.retryAfterMs / 60000));
    await logAudit({
      actor: parsed.data.email,
      action: "Connexion bloquée",
      target: "Trop de tentatives",
      detail: `Nouvel essai dans environ ${minutes} min`,
    });
    return c.json(
      {
        error: `Trop de tentatives de connexion. Réessayez dans environ ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      },
      429,
    );
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const user = rows[0];
  if (!user) {
    // Même coût de calcul qu'une vérification réelle, pour ne pas révéler
    // l'existence d'un compte par le temps de réponse.
    await hashPassword(parsed.data.password);
    recordLoginFailure(parsed.data.email);
    await logAudit({
      actor: parsed.data.email,
      action: "Échec de connexion",
      target: "Compte inconnu",
    });
    return c.json({ error: "Adresse ou mot de passe incorrect." }, 401);
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    recordLoginFailure(parsed.data.email);
    await logAudit({
      establishmentId: user.establishmentId,
      userId: user.id,
      actor: user.name,
      action: "Échec de connexion",
      target: user.email,
    });
    return c.json({ error: "Adresse ou mot de passe incorrect." }, 401);
  }
  clearLoginFailures(parsed.data.email);
  const { token } = await createSession(user.id);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  setCookie(c, SESSION_COOKIE, token, cookieOptions);
  await logAudit({
    establishmentId: user.establishmentId,
    userId: user.id,
    actor: user.name,
    action: "Connexion",
    target: user.email,
  });
  return c.json(await sessionPayload(user.id));
});

authRoutes.post("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const session = await currentSession(c.req.raw.headers).catch(() => null);
    await revokeSession(token);
    if (session) {
      await logAudit({
        establishmentId: session.user.establishmentId,
        userId: session.user.id,
        actor: session.user.name,
        action: "Déconnexion",
        target: session.user.email,
      });
    }
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

/** Session courante — `null` si non connecté (pas d'erreur côté client). */
authRoutes.get("/session", async (c) => {
  const session = await currentSession(c.req.raw.headers);
  if (!session) return c.json({ session: null });
  return c.json({
    session: {
      user: publicUser(session.user),
      establishment: session.establishment
        ? {
            id: session.establishment.id,
            name: session.establishment.name,
            slug: session.establishment.slug,
            email: session.establishment.email,
            phone: session.establishment.phone,
            address: session.establishment.address,
            currency: session.establishment.currency,
          }
        : null,
    },
  });
});

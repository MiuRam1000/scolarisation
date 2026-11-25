export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "direction" | "administration" | "teacher" | "supervisor" | "accountant" | "parent" | "student" | "platform";
  establishmentId: string | null;
};

export type SessionEstablishment = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
};

export type Session = { user: SessionUser; establishment: SessionEstablishment | null };

export const ROLE_LABELS: Record<SessionUser["role"], string> = {
  direction: "Direction",
  administration: "Administration",
  teacher: "Enseignant",
  supervisor: "Surveillant",
  accountant: "Comptable",
  parent: "Parent",
  student: "Élève",
  platform: "Plateforme SaaS",
};

/** Libellé de profil utilisé par la navigation existante. */
export const roleToProfile = (role?: string) =>
  (role && ROLE_LABELS[role as SessionUser["role"]]) || "Direction";

export const isManagerRole = (role?: string) =>
  role === "direction" || role === "administration";

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Une erreur est survenue. Réessayez.",
    );
  }
  return data as T;
}

export async function fetchSession(): Promise<Session | null> {
  const data = await request<{ session: Session | null }>("/api/auth/session");
  return data.session;
}

export function loginRequest(email: string, password: string) {
  return request<Session>("/api/auth/login", { email, password });
}

export function registerRequest(input: {
  schoolName: string;
  name: string;
  email: string;
  password: string;
  address?: string;
}) {
  return request<Session>("/api/auth/register", input);
}

export function logoutRequest() {
  return request<{ ok: true }>("/api/auth/logout", {});
}

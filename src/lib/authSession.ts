export const AUTH_SESSION_KEY = "menu_mitra_admin_session";

export const AUTH_SESSION_UPDATED_EVENT = "menu_mitra_session_updated";

/** How long a cached profile check is trusted (avoids hitting /profile on every navigation). */
const PROFILE_REVALIDATE_MS = 2 * 60 * 1000;

/** Treat token as expired this many ms before Firebase expiry. */
const TOKEN_EXPIRY_SKEW_MS = 60_000;

const PROFILE_URL = "/api/v1/auth/profile";

function notifySessionListeners(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT));
}

export type AuthSessionUser = {
  uid: string;
  email: string;
  role?: string;
  firestoreId?: string;
  name?: string;
};

export type AuthSessionPayload = {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthSessionUser;
  /** Post-login route; used when returning to the app. */
  redirectTo?: string;
  /** Last time the session was confirmed against Firestore via /profile (not JWT-only). */
  lastProfileValidatedAt?: number;
};

export function defaultDashboardPathForRole(role: string | undefined): string {
  const r = (role || "").toUpperCase();
  if (r === "SUPERADMIN" || r === "ADMIN") {
    return "/superadmin/dashboard";
  }
  return "/admin/dashboard";
}

export function saveAuthSession(
  payload: AuthSessionPayload,
  persistent: boolean,
): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(payload);
  if (persistent) {
    localStorage.setItem(AUTH_SESSION_KEY, raw);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } else {
    sessionStorage.setItem(AUTH_SESSION_KEY, raw);
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function readAuthSession(): AuthSessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(AUTH_SESSION_KEY) ||
    sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSessionPayload;
  } catch {
    return null;
  }
}

/** True if the ID token is present and not past expiry (with skew). Does not call the server. */
export function isAuthSessionTokenValid(session: AuthSessionPayload | null): boolean {
  if (!session?.idToken || typeof session.expiresAt !== "number") return false;
  return Date.now() < session.expiresAt - TOKEN_EXPIRY_SKEW_MS;
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  notifySessionListeners();
}

type ProfileSuccessJson = {
  success?: boolean;
  data?: Record<string, unknown> & { id?: string; role?: string; name?: string; email?: string; uid?: string };
};

/**
 * Re-validates the session against Firestore (same rules as login), not only the JWT.
 * On failure, clears storage. On success, refreshes user fields from the server.
 */
export async function validateAuthSessionWithBackend(options?: {
  force?: boolean;
}): Promise<AuthSessionPayload | null> {
  if (typeof window === "undefined") return null;

  const session = readAuthSession();
  if (!session) return null;

  if (!isAuthSessionTokenValid(session)) {
    clearAuthSession();
    return null;
  }

  const now = Date.now();
  if (
    !options?.force &&
    session.lastProfileValidatedAt != null &&
    now - session.lastProfileValidatedAt < PROFILE_REVALIDATE_MS
  ) {
    return session;
  }

  const res = await fetch(PROFILE_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${session.idToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    clearAuthSession();
    return null;
  }

  const json = (await res.json()) as ProfileSuccessJson;
  const row = json.data;
  if (!json.success || !row || typeof row !== "object") {
    clearAuthSession();
    return null;
  }

  const firestoreId =
    typeof row.id === "string" ? row.id : session.user.firestoreId;
  const role = typeof row.role === "string" ? row.role : session.user.role;
  const name = typeof row.name === "string" ? row.name : session.user.name;
  const email = typeof row.email === "string" ? row.email : session.user.email;
  const uid =
    typeof row.uid === "string" ? row.uid : session.user.uid;

  const persistent = Boolean(localStorage.getItem(AUTH_SESSION_KEY));
  const next: AuthSessionPayload = {
    ...session,
    user: {
      ...session.user,
      uid,
      email,
      role,
      name,
      firestoreId,
    },
    redirectTo:
      session.redirectTo ?? defaultDashboardPathForRole(role),
    lastProfileValidatedAt: now,
  };

  saveAuthSession(next, persistent);
  notifySessionListeners();
  return next;
}

/** Merge fields into the stored session user (same storage as login). */
export function updateAuthSessionUser(partial: Partial<AuthSessionUser>): void {
  if (typeof window === "undefined") return;
  const fromLocal = localStorage.getItem(AUTH_SESSION_KEY);
  const fromSession = sessionStorage.getItem(AUTH_SESSION_KEY);
  const persistent = Boolean(fromLocal);
  const raw = fromLocal || fromSession;
  if (!raw) return;
  try {
    const s = JSON.parse(raw) as AuthSessionPayload;
    saveAuthSession(
      { ...s, user: { ...s.user, ...partial } },
      persistent,
    );
  } catch {
    /* ignore */
  }
}

export const AUTH_SESSION_KEY = "menu_mitra_admin_session";

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
};

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

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
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
    const session = JSON.parse(raw) as AuthSessionPayload;
    saveAuthSession(
      { ...session, user: { ...session.user, ...partial } },
      persistent,
    );
  } catch {
    /* ignore */
  }
}

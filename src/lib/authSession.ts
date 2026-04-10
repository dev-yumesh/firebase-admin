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

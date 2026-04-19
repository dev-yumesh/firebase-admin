import { readAuthSession } from "@/lib/authSession";

/** Attach for browser `fetch` to authenticated API routes. */
export function authHeadersJson(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const token = readAuthSession()?.idToken;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

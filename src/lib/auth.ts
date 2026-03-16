import { auth } from "@/lib/firebaseAdmin";

export async function verifyAuthToken(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split("Bearer ")[1];

  const decoded = await auth.verifyIdToken(token);

  return decoded;
}


export function requireRole(user: any, roles: string[]) {
    if (!roles.includes(user.role)) {
      throw new Error("Forbidden");
    }
  }
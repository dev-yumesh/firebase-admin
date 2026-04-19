import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FB_SHOP_COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

export type ApiCaller = {
  uid: string;
  role: string;
  firestoreUserId: string;
  email: string;
};

export function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

export function isSuperRole(role: string): boolean {
  const r = role.toUpperCase();
  return r === "SUPERADMIN" || r === "ADMIN";
}

export async function requireApiCaller(
  req: NextRequest,
): Promise<ApiCaller | NextResponse> {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authorization required" },
      { status: 401 },
    );
  }

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid or expired session" },
      { status: 401 },
    );
  }

  const snap = await db
    .collection(FB_USER_COLLECTION)
    .where("uid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const doc = snap.docs[0]!;
  const data = doc.data() as Record<string, unknown>;
  return {
    uid,
    role: String(data.role || "").toUpperCase(),
    firestoreUserId: doc.id,
    email: String(data.email || "").toLowerCase(),
  };
}

export async function requireSuperadmin(
  req: NextRequest,
): Promise<ApiCaller | NextResponse> {
  const caller = await requireApiCaller(req);
  if (caller instanceof NextResponse) return caller;
  if (!isSuperRole(caller.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return caller;
}

export function shopOwnedByUser(
  data: Record<string, unknown>,
  caller: ApiCaller,
): boolean {
  const ou = String(data.ownerUID ?? data.ownerUid ?? "");
  const oid = String(data.ownerId ?? "");
  return ou === caller.uid || oid === caller.firestoreUserId;
}

export async function getShopDocIdsForCaller(caller: ApiCaller): Promise<string[]> {
  if (isSuperRole(caller.role)) return [];
  const ids = new Set<string>();
  const q1 = await db
    .collection(FB_SHOP_COLLECTION)
    .where("ownerUID", "==", caller.uid)
    .get();
  const q2 = await db
    .collection(FB_SHOP_COLLECTION)
    .where("ownerId", "==", caller.firestoreUserId)
    .get();
  q1.docs.forEach((d) => ids.add(d.id));
  q2.docs.forEach((d) => ids.add(d.id));
  return [...ids];
}

export async function assertShopDocAccess(
  caller: ApiCaller,
  shopId: string,
): Promise<true | NextResponse> {
  const doc = await db.collection(FB_SHOP_COLLECTION).doc(String(shopId)).get();
  if (!doc.exists) {
    return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
  }
  const data = doc.data() || {};
  if (!isSuperRole(caller.role) && !shopOwnedByUser(data as Record<string, unknown>, caller)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return true;
}

export async function assertMenuItemShopAccess(
  caller: ApiCaller,
  shopId: string,
): Promise<true | NextResponse> {
  if (!shopId.trim()) {
    return NextResponse.json(
      { success: false, error: "shopId is required" },
      { status: 400 },
    );
  }
  return assertShopDocAccess(caller, shopId);
}

import { db } from "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";
import { USER_ROLES } from "@/constants/enums";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FB_SHOP_COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

export type SessionGateFailureCode =
  | "NO_FIRESTORE_PROFILE"
  | "OWNER_PRIMARY_SHOP_MISSING";

function ownerHasEligiblePrimaryShop(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
): boolean {
  if (docs.length === 0) return false;
  if (docs.length === 1) return true;
  return docs.some((d) => d.data()?.isPrimary === true);
}

async function loadShopsForOwner(uid: string, firestoreUserId: string) {
  const byUid = await db
    .collection(FB_SHOP_COLLECTION)
    .where("ownerUID", "==", uid)
    .get();
  if (!byUid.empty) return byUid.docs;
  const byOwnerId = await db
    .collection(FB_SHOP_COLLECTION)
    .where("ownerId", "==", firestoreUserId)
    .get();
  return byOwnerId.docs;
}

/**
 * After Firebase Auth proves identity, require Firestore user + owner primary shop
 * (same rules as login).
 */
export async function evaluateSessionAfterAuth(uid: string): Promise<
  | { ok: true; firestoreId: string; role?: string; name?: string }
  | { ok: false; code: SessionGateFailureCode }
> {
  const snap = await db
    .collection(FB_USER_COLLECTION)
    .where("uid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) {
    return { ok: false, code: "NO_FIRESTORE_PROFILE" };
  }

  const doc = snap.docs[0]!;
  const data = doc.data() as Record<string, unknown>;
  const role = typeof data.role === "string" ? data.role : undefined;
  const name = typeof data.name === "string" ? data.name : undefined;
  const firestoreId = doc.id;

  if ((role || "").toUpperCase() === USER_ROLES.OWNER) {
    const shopDocs = await loadShopsForOwner(uid, firestoreId);
    if (!ownerHasEligiblePrimaryShop(shopDocs)) {
      return { ok: false, code: "OWNER_PRIMARY_SHOP_MISSING" };
    }
  }

  return { ok: true, firestoreId, role, name };
}

export function dashboardPathForRole(role: string | undefined): string {
  const r = (role || "").toUpperCase();
  if (r === "SUPERADMIN" || r === "ADMIN") {
    return "/superadmin/dashboard";
  }
  if (r === "OWNER" || r === "MANAGER") {
    return "/admin/dashboard";
  }
  return "/admin/dashboard";
}

export function sessionGateErrorMessage(code: SessionGateFailureCode): string {
  switch (code) {
    case "NO_FIRESTORE_PROFILE":
      return "Account setup is incomplete. No user profile was found for this sign-in. Please finish registration or contact support.";
    case "OWNER_PRIMARY_SHOP_MISSING":
      return "Owner account is incomplete: a primary shop is required in your profile. Please complete shop registration.";
    default:
      return "Session is not valid for this app.";
  }
}

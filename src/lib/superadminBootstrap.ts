import { APP_LANGUAGE } from "@/constants/enums";
import { env } from "@/config/env.config";
import { auth, db, serverTimestamp } from "@/lib/firebaseAdmin";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;

/**
 * When Firebase Auth already has a user but Firestore has no `users` row with that `uid`,
 * create a minimal SUPERADMIN profile — only if `SUPERADMIN_BOOTSTRAP_EMAIL` (server env)
 * matches the account email. Password is never read from env; Firebase already verified it.
 */
export async function tryBootstrapSuperadminProfile(
  uid: string,
  normalizedLoginEmail: string,
): Promise<boolean> {
  const allowed = (process.env.SUPERADMIN_BOOTSTRAP_EMAIL ?? "")
    .trim()
    .toLowerCase();
  if (!allowed || allowed !== normalizedLoginEmail) {
    return false;
  }

  const existing = await db
    .collection(FB_USER_COLLECTION)
    .where("uid", "==", uid)
    .limit(1)
    .get();
  if (!existing.empty) {
    return false;
  }

  let email = normalizedLoginEmail;
  let name = "Super Admin";
  let isEmailVerified = false;
  try {
    const u = await auth.getUser(uid);
    if (u.email) email = u.email.trim().toLowerCase();
    if (u.displayName?.trim()) name = u.displayName.trim();
    isEmailVerified = Boolean(u.emailVerified);
  } catch {
    /* use login email + defaults */
  }

  await db.collection(FB_USER_COLLECTION).add({
    uid,
    name,
    email,
    phone: null,
    role: "SUPERADMIN",
    isActive: true,
    isEmailVerified,
    isPhoneVerified: false,
    status: "ACTIVE",
    language: APP_LANGUAGE.EN,
    availableWalletBalance: 0,
    address: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return true;
}

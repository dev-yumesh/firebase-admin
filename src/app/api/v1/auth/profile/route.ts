import { NextRequest, NextResponse } from "next/server";
import {
  evaluateSessionAfterAuth,
  sessionGateErrorMessage,
} from "@/lib/accountSessionGate";
import { auth, db, serverTimestamp } from "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";
import {
  profilePatchBodySchema,
  removeUndefinedFields,
  toIsoDate,
} from "@/utils/validators";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FB_SHOP_COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim() || null;
}

function sanitizeUserPayload(data: Record<string, unknown>) {
  const next = { ...data };
  delete next.password;
  return next;
}

async function getUserDocForUid(uid: string) {
  const snap = await db
    .collection(FB_USER_COLLECTION)
    .where("uid", "==", uid)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const raw = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    ...sanitizeUserPayload(raw),
    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt),
  };
}

function normalizeShopDoc(doc: { id: string; data: () => Record<string, unknown> }) {
  const raw = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    ...raw,
    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt),
  };
}

async function getShopForOwnerUid(uid: string) {
  const snap = await db
    .collection(FB_SHOP_COLLECTION)
    .where("ownerUID", "==", uid)
    .get();
  if (snap.empty) return null;
  const primary = snap.docs.find((d) => d.data()?.isPrimary === true);
  const doc = primary ?? snap.docs[0]!;
  return normalizeShopDoc(doc);
}

export async function GET(req: NextRequest) {
  try {
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

    const gate = await evaluateSessionAfterAuth(uid);
    if (!gate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: sessionGateErrorMessage(gate.code),
          errorCode: gate.code,
        },
        { status: 403 },
      );
    }

    const user = await getUserDocForUid(uid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 },
      );
    }

    const role = String((user as { role?: string }).role || "").toUpperCase();
    const shop =
      role === "OWNER" ? await getShopForOwnerUid(uid) : null;

    return NextResponse.json({ success: true, data: user, shop });
  } catch (error: unknown) {
    console.error("profile GET", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
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

    const body = (await req.json()) as Record<string, unknown>;
    const validated = await profilePatchBodySchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const userUpdates = removeUndefinedFields({
      name: validated.name,
      language: validated.language,
      profilePictureURL: validated.profilePictureURL,
    } as Record<string, unknown>);

    const shopIn = validated.shop;
    const shopUpdates =
      shopIn === undefined
        ? {}
        : removeUndefinedFields({
            shopName: shopIn.shopName,
            shopType: shopIn.shopType,
            hasSeating: shopIn.hasSeating,
            totalFloors: shopIn.totalFloors,
            logoURL: shopIn.logoURL,
            bannerImageURL: shopIn.bannerImageURL,
          } as Record<string, unknown>);

    const hasUserUpdates = Object.keys(userUpdates).length > 0;
    const hasShopUpdates = Object.keys(shopUpdates).length > 0;

    if (!hasUserUpdates && !hasShopUpdates) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const userSnap = await db
      .collection(FB_USER_COLLECTION)
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 },
      );
    }

    const userDoc = userSnap.docs[0]!;
    const userData = userDoc.data() as { role?: string };
    const role = String(userData.role || "").toUpperCase();

    if (hasUserUpdates) {
      await userDoc.ref.update({
        ...userUpdates,
        updatedAt: serverTimestamp(),
      });
    }

    if (hasShopUpdates) {
      if (role !== "OWNER") {
        return NextResponse.json(
          { success: false, error: "Only shop owners can update shop details" },
          { status: 403 },
        );
      }

      const existingShop = await getShopForOwnerUid(uid);
      if (!existingShop?.id) {
        return NextResponse.json(
          { success: false, error: "No shop found for this account" },
          { status: 404 },
        );
      }

      const shopRef = db.collection(FB_SHOP_COLLECTION).doc(String(existingShop.id));
      const shopDoc = await shopRef.get();
      if (!shopDoc.exists) {
        return NextResponse.json(
          { success: false, error: "Shop not found" },
          { status: 404 },
        );
      }
      const sd = shopDoc.data() || {};
      if (String(sd.ownerUID || "") !== uid) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }

      await shopRef.update({
        ...shopUpdates,
        updatedAt: serverTimestamp(),
      });
    }

    const user = await getUserDocForUid(uid);
    const shop =
      role === "OWNER" ? await getShopForOwnerUid(uid) : null;

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      data: user,
      shop,
    });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    if (err.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: err.message || "Validation failed" },
        { status: 400 },
      );
    }
    console.error("profile PATCH", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}

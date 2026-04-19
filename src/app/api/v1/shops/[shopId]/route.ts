import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import {
  removeUndefinedFields,
  shopUpdateSchema,
  toIsoDate,
} from "@/utils/validators";
import { env } from "@/config/env.config";
import { assertShopDocAccess, isSuperRole, requireApiCaller } from "@/lib/apiRouteAuth";

const COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

const normalizeShopDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data: Record<string, unknown> = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const { shopId } = await params;
    const id = shopId || new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Shop id is required" }, { status: 400 });
    }

    const gate = await assertShopDocAccess(caller, id);
    if (gate !== true) return gate;

    const doc = await db.collection(COLLECTION).doc(String(id)).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = doc.data() || {};
    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const { shopId } = await params;
    const { searchParams } = new URL(req.url);
    const body: Record<string, unknown> = await req.json();
    const id = shopId || searchParams.get("id") || body?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const gate = await assertShopDocAccess(caller, String(id));
    if (gate !== true) return gate;

    const docRef = db.collection(COLLECTION).doc(String(id));
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    const validated = await shopUpdateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const updatePayload = removeUndefinedFields({
      ...validated,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      ownerId: validated?.ownerId ?? validated?.ownerUID,
      ownerUID: validated?.ownerUID ?? validated?.ownerId,
    });

    if (!isSuperRole(caller.role) && (updatePayload.ownerUID || updatePayload.ownerId)) {
      return NextResponse.json(
        { success: false, error: "Cannot reassign shop ownership" },
        { status: 403 },
      );
    }

    if (!updatePayload || Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    await docRef.update({
      ...updatePayload,
      updatedAt: serverTimestamp(),
    });

    const saved = await docRef.get();
    return NextResponse.json({ success: true, data: normalizeShopDoc(saved) });
  } catch (error: unknown) {
    const err = error as { errors?: string[]; message?: string };
    const message = Array.isArray(err?.errors)
      ? err.errors.join(", ")
      : err?.message || "Update failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const { shopId } = await params;
    const { searchParams } = new URL(req.url);
    const id = shopId || searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const gate = await assertShopDocAccess(caller, id);
    if (gate !== true) return gate;

    const docRef = db.collection(COLLECTION).doc(String(id));
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: "Shop deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

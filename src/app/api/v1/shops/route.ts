import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import {
  removeUndefinedFields,
  shopCreateSchema,
  shopUpdateSchema,
  toIsoDate,
} from "@/utils/validators";
import { env } from "@/config/env.config";
import {
  assertShopDocAccess,
  isSuperRole,
  requireApiCaller,
  type ApiCaller,
} from "@/lib/apiRouteAuth";

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

async function fetchShopDocsForList(caller: ApiCaller) {
  if (isSuperRole(caller.role)) {
    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
    return { docs: snapshot.docs };
  }
  const byUid = await db.collection(COLLECTION).where("ownerUID", "==", caller.uid).get();
  const byOwnerId = await db
    .collection(COLLECTION)
    .where("ownerId", "==", caller.firestoreUserId)
    .get();
  const map = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  byUid.docs.forEach((d) => map.set(d.id, d));
  byOwnerId.docs.forEach((d) => map.set(d.id, d));
  const docs = [...map.values()].sort((a, b) => {
    const ta = toIsoDate(a.data()?.createdAt) || "";
    const tb = toIsoDate(b.data()?.createdAt) || "";
    return tb.localeCompare(ta);
  });
  return { docs };
}

export async function GET(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ownerIdParam = searchParams.get("ownerId");

    if (id) {
      const gate = await assertShopDocAccess(caller, id);
      if (gate !== true) return gate;

      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
      }
      const docData: Record<string, unknown> = doc.data() || {};
      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...docData,
          createdAt: toIsoDate(docData.createdAt),
          updatedAt: toIsoDate(docData.updatedAt),
        },
      });
    }

    if (ownerIdParam) {
      const effectiveOwnerUid = isSuperRole(caller.role)
        ? ownerIdParam
        : caller.uid;
      if (!isSuperRole(caller.role) && ownerIdParam !== caller.uid) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const snapshot = await db
        .collection(COLLECTION)
        .where("ownerUID", "==", effectiveOwnerUid)
        .where("isPrimary", "==", true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
      }

      const doc = snapshot.docs[0]!;
      const gate = await assertShopDocAccess(caller, doc.id);
      if (gate !== true) return gate;

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
    }

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 10;

    const pack = await fetchShopDocsForList(caller);
    const allShops = pack.docs.map((doc) => normalizeShopDoc(doc));

    const filteredShops = search
      ? allShops.filter((shop: Record<string, unknown>) => {
          const shopName = String(shop.shopName || "").toLowerCase();
          const shopEmail = String(shop.shopEmail || "").toLowerCase();
          const shopType = String(shop.shopType || "").toLowerCase();
          const oid = String(shop.ownerId || "").toLowerCase();
          const status = String(shop.status || "").toLowerCase();

          return (
            shopName.includes(search) ||
            shopEmail.includes(search) ||
            shopType.includes(search) ||
            oid.includes(search) ||
            status.includes(search)
          );
        })
      : allShops;

    const total = filteredShops.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filteredShops.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const body: Record<string, unknown> = await req.json();

    const validated = await shopCreateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const ownerUID = isSuperRole(caller.role)
      ? String(body?.ownerUID ?? body?.ownerId ?? "") || null
      : caller.uid;
    const ownerFirestoreId = isSuperRole(caller.role)
      ? String(body?.ownerId ?? body?.ownerUID ?? "") || null
      : caller.firestoreUserId;

    if (!isSuperRole(caller.role) && (ownerUID !== caller.uid || ownerFirestoreId !== caller.firestoreUserId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({
      shopName: validated.shopName,
      shopType: validated.shopType,
      hasSeating: validated.hasSeating,
      totalFloors: validated.totalFloors,
      logoURL: validated.logoURL ?? null,
      bannerImageURL: validated.bannerImageURL ?? null,
      ownerUID,
      ownerId: ownerFirestoreId,
      isVerified: body?.isVerified ?? false,
      shopQR: body?.shopQR ?? null,
      isPrimary: body?.isPrimary ?? true,
      isActive: body?.isActive ?? true,
      status: body?.status ?? "ACTIVE",
      availableWalletBalance: body?.availableWalletBalance ?? 0,
      address: body?.address ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const saved = await docRef.get();
    return NextResponse.json({ success: true, data: normalizeShopDoc(saved) }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { errors?: string[]; message?: string };
    const message = Array.isArray(err?.errors)
      ? err.errors.join(", ")
      : err?.message || "Create failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const { searchParams } = new URL(req.url);
    const body: Record<string, unknown> = await req.json();
    const id = searchParams.get("id") || body?.id;
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
    return NextResponse.json({
      success: true,
      data: normalizeShopDoc(saved),
    });
  } catch (error: unknown) {
    const err = error as { errors?: string[]; message?: string };
    const message = Array.isArray(err?.errors)
      ? err.errors.join(", ")
      : err?.message || "Update failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    if (caller instanceof NextResponse) return caller;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
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

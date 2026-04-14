import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import {
  removeUndefinedFields,
  shopCreateSchema,
  shopUpdateSchema,
  toIsoDate,
} from "@/utils/validators";
import { env } from "@/config/env.config";

const COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

const normalizeShopDoc = (doc: any) => {
  const data: any = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const ownerId = searchParams.get("ownerId");
    // ownerUID filter is used for the "single shop by owner" lookup.

    // -------------------------
    // GET Single Shop by document id (?id=)
    // -------------------------
    if (id) {
      const doc = await db.collection(COLLECTION).doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { success: false, error: "Shop not found" },
          { status: 404 },
        );
      }

      const docData: any = doc.data() || {};

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

    // -------------------------
    // GET Single Shop by owner UID (?ownerId= as auth uid)
    // -------------------------
    if (ownerId) {
      const snapshot = await db
        .collection(COLLECTION)
        .where("ownerUID", "==", ownerId)
        .where("isPrimary", "==", true)
        .limit(1)
        .get();
    
      if (snapshot.empty) {
        return NextResponse.json(
          {
            success: false,
            error: "Shop not found",
          },
          { status: 404 }
        );
      }
    
      const doc = snapshot.docs[0];
      const data: any = doc.data() || {};
    
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

    // -------------------------
    // Pagination Params
    // -------------------------
    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    // -------------------------
    // Base Query
    // -------------------------
    let query: FirebaseFirestore.Query = db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc");

    // Owner filter
    if (ownerId) {
      query = query.where("ownerId", "==", ownerId);
    }

    const snapshot = await query.get();

    const allShops = snapshot.docs.map((doc) => {
      const data: any = doc.data() || {};

      return {
        id: doc.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      };
    });

    // -------------------------
    // Search Filter
    // -------------------------
    const filteredShops = search
      ? allShops.filter((shop: any) => {
          const shopName = String(shop.shopName || "").toLowerCase();
          const shopEmail = String(shop.shopEmail || "").toLowerCase();
          const shopType = String(shop.shopType || "").toLowerCase();
          const ownerId = String(shop.ownerId || "").toLowerCase();
          const status = String(shop.status || "").toLowerCase();

          return (
            shopName.includes(search) ||
            shopEmail.includes(search) ||
            shopType.includes(search) ||
            ownerId.includes(search) ||
            status.includes(search)
          );
        })
      : allShops;

    // -------------------------
    // Pagination Logic
    // -------------------------
    const total = filteredShops.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filteredShops.slice(start, start + limit);

    // -------------------------
    // Response
    // -------------------------
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
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();

    const validated = await shopCreateSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const ownerUID = body?.ownerUID ?? body?.ownerId ?? null;
    const ownerId = body?.ownerId ?? body?.ownerUID ?? null;

    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({
      // Validated fields
      shopName: validated.shopName,
      shopType: validated.shopType,
      hasSeating: validated.hasSeating,
      totalFloors: validated.totalFloors,
      logoURL: validated.logoURL ?? null,
      bannerImageURL: validated.bannerImageURL ?? null,

      // Optional metadata
      ownerUID,
      ownerId,
      isVerified: body?.isVerified ?? false,
      shopQR: body?.shopQR ?? null,
      isPrimary: body?.isPrimary ?? true,

      // Account-like fields used elsewhere in the app
      isActive: body?.isActive ?? true,
      status: body?.status ?? "ACTIVE",
      availableWalletBalance: body?.availableWalletBalance ?? 0,
      address: body?.address ?? null,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const saved = await docRef.get();
    return NextResponse.json(
      { success: true, data: normalizeShopDoc(saved) },
      { status: 201 }
    );
  } catch (error: any) {
    const message = Array.isArray(error?.errors)
      ? error.errors.join(", ")
      : error?.message || "Create failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body: any = await req.json();

    const id = searchParams.get("id") || body?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const docRef = db.collection(COLLECTION).doc(String(id));
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
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
      // Keep these in sync if both are provided.
      ownerId: validated?.ownerId ?? validated?.ownerUID,
      ownerUID: validated?.ownerUID ?? validated?.ownerId,
    });

    if (!updatePayload || Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    await docRef.update({
      ...updatePayload,
      updatedAt: serverTimestamp(),
    });

    const saved = await docRef.get();
    return NextResponse.json({ success: true, data: normalizeShopDoc(saved) });
  } catch (error: any) {
    const message = Array.isArray(error?.errors)
      ? error.errors.join(", ")
      : error?.message || "Update failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const docRef = db.collection(COLLECTION).doc(String(id));
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: "Shop deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
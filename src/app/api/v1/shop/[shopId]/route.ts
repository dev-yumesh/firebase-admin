import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { toIsoDate } from "@/utils/validators";
import { env } from "@/config/env.config";

const COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const ownerID = searchParams.get("ownerID");

    // -------------------------
    // GET Single Shop
    // -------------------------
    if (id) {
      const doc = await db.collection(COLLECTION).doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          {
            success: false,
            error: "Shop not found",
          },
          { status: 404 }
        );
      }

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
    if (ownerID) {
      query = query.where("ownerId", "==", ownerID);
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
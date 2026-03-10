import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { toIsoDate } from "@/utils/validators";
import { env } from "@/config/env.config";

const COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const doc = await db.collection(COLLECTION).doc(id).get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const data: any = doc.data() || {};

      return NextResponse.json({
        id: doc.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      });
    }

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();

    const allShops = snapshot.docs.map((doc, index) => {
      const data: any = doc.data() || {};

      return {
        id: doc.id ?? index + 1,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      };
    });

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

    const total = filteredShops.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filteredShops.slice(start, start + limit);

    return NextResponse.json({
      items,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

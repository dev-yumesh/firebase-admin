import { env } from "@/config/env.config";
import { db } from "@/lib/firebaseAdmin";
import { removeUndefinedFields, toIsoDate } from "@/utils/validators";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION = env.FIREBASE_MENU_ITEMS_COLLECTION_ID;

const normalizeDoc = (doc: any) => {
    const data: any = doc.data() || {};
    return {
        id: doc.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
    };
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const newItem = {
            ...body,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection(COLLECTION).add(newItem);

        return NextResponse.json({
            success: true,
            data: {
                id: docRef.id,
                ...newItem,
                createdAt: toIsoDate(newItem.createdAt),
                updatedAt: toIsoDate(newItem.updatedAt),
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Create failed",
            },
            { status: 500 }
        );
    }
}

// Get single item (?id=...) or paginated list (?page=1&limit=10&search=...)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const doc = await db.collection(COLLECTION).doc(String(id)).get();

            if (!doc.exists) {
                return NextResponse.json(
                    { success: false, error: "Not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: normalizeDoc(doc),
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

        const snapshot = await db
            .collection(COLLECTION)
            .orderBy("updatedAt", "desc")
            .get();

        const allItems = snapshot.docs.map((doc) => normalizeDoc(doc));

        const filteredItems = search
            ? allItems.filter((item: any) => {
                  const title = String(item.title || "").toLowerCase();
                  const name = String(item.name || "").toLowerCase();
                  const description = String(item.description || "").toLowerCase();
                  const category = String(item.category || "").toLowerCase();
                  const categoryId = String(item.categoryId || "").toLowerCase();
                  const slug = String(item.slug || "").toLowerCase();

                  return (
                      title.includes(search) ||
                      name.includes(search) ||
                      description.includes(search) ||
                      category.includes(search) ||
                      categoryId.includes(search) ||
                      slug.includes(search)
                  );
              })
            : allItems;

        const total = filteredItems.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * limit;
        const items = filteredItems.slice(start, start + limit);

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

// Update item (?id=...)
export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const body: any = await req.json();
        const id = searchParams.get("id") || body.id;

        if (!id) {
            return NextResponse.json({ error: "id required" }, { status: 400 });
        }

        const docRef = db.collection(COLLECTION).doc(String(id));
        const existing = await docRef.get();

        if (!existing.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updatePayload = removeUndefinedFields({
            ...body,
            id: undefined,
            createdAt: undefined,
            updatedAt: new Date(),
        });

        await docRef.update(updatePayload);

        return NextResponse.json({ message: "Item updated" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete item (?id=...)
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id required" }, { status: 400 });
        }

        const docRef = db.collection(COLLECTION).doc(String(id));
        const existing = await docRef.get();

        if (!existing.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await docRef.delete();
        return NextResponse.json({ message: "Item deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

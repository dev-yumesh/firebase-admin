import { env } from "@/config/env.config";
import { db } from "@/lib/firebaseAdmin";
import { removeUndefinedFields, toIsoDate } from "@/utils/validators";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION = env.FIREBASE_MENU_ITEMS_COLLECTION_ID;

const SERVING_UNITS = new Set([
    "piece",
    "slice",
    "plate",
    "gram",
    "kilogram",
    "other",
]);

type MenuItemMedia = {
    url: string;
    isPrimary: boolean;
    type: "video" | "image";
};

/** Align with Menu_Item (model) + legacy quantity fields. */
const normalizeCreateBody = (body: Record<string, unknown>) => {
    const num = (v: unknown, fallback = 0) =>
        typeof v === "number" && !Number.isNaN(v) ? v : fallback;

    const asDateStr = (v: unknown) => {
        if (v == null || v === "") return "";
        const iso = toIsoDate(v);
        if (iso) return iso;
        return typeof v === "string" ? v : "";
    };

    let categoryIds: string[] = [];
    if (Array.isArray(body.categoryIds)) {
        categoryIds = body.categoryIds.map(String).filter(Boolean);
    } else if (body.categoryId != null && String(body.categoryId).trim()) {
        categoryIds = [String(body.categoryId)];
    }

    let medias: MenuItemMedia[] = [];
    if (Array.isArray(body.medias)) {
        medias = (body.medias as unknown[]).map((raw) => {
            const m = raw as Record<string, unknown>;
            return {
                url: String(m?.url ?? ""),
                isPrimary: Boolean(m?.isPrimary),
                type: m?.type === "video" ? ("video" as const) : ("image" as const),
            };
        });
    }
    const legacyPhoto =
        typeof body.photo === "string" && body.photo.trim()
            ? body.photo.trim()
            : "";
    if (!medias.length && legacyPhoto) {
        medias = [{ url: legacyPhoto, isPrimary: true, type: "image" }];
    }

    const servingQtyRaw =
        body.servingQuantity !== undefined && body.servingQuantity !== null
            ? body.servingQuantity
            : body.quantity;
    const servingQuantity = num(servingQtyRaw, 1);

    const unitRaw = String(
        body.servingUnit ?? body.quantityUnit ?? body.unit ?? "piece",
    )
        .trim()
        .toLowerCase();
    const servingUnit = SERVING_UNITS.has(unitRaw) ? unitRaw : "piece";

    return removeUndefinedFields({
        name: String(body.name ?? "").trim(),
        description: String(body.description ?? "").trim(),
        categoryIds,
        price: num(body.price, 0),
        medias,
        servingQuantity,
        servingUnit,
        isInOffer: Boolean(body.isInOffer),
        offerPrice: num(body.offerPrice, 0),
        offerStartDate: asDateStr(body.offerStartDate),
        offerEndDate: asDateStr(body.offerEndDate),
        isHalfAvailable: Boolean(body.isHalfAvailable),
        quantity: servingQuantity,
        quantityUnit: servingUnit,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
        shopId: String(body.shopId ?? "").trim(),
        status:
            body.status != null && String(body.status).trim()
                ? String(body.status).trim()
                : "ACTIVE",
    });
};

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
        const normalized = normalizeCreateBody(
            body && typeof body === "object" ? body : {},
        );

        if (!normalized.name) {
            return NextResponse.json(
                { success: false, error: "name is required" },
                { status: 400 },
            );
        }
        if (!normalized.shopId) {
            return NextResponse.json(
                { success: false, error: "shopId is required" },
                { status: 400 },
            );
        }
        if (!normalized.categoryIds?.length) {
            return NextResponse.json(
                { success: false, error: "categoryIds is required" },
                { status: 400 },
            );
        }

        {
            const catCol = env.FIREBASE_MENU_CATEGORIES_COLLECTION_ID;
            const snaps = await Promise.all(
                normalized.categoryIds.map((id) =>
                    db.collection(catCol).doc(id).get(),
                ),
            );
            const missing = snaps.some((s) => !s.exists);
            if (missing) {
                return NextResponse.json(
                    { success: false, error: "One or more categories not found." },
                    { status: 400 },
                );
            }
            type CatMeta = { groupType: string; multi: boolean };
            const metas: CatMeta[] = snaps.map((snap) => {
                const d = (snap.data() || {}) as {
                    groupType?: string;
                    isMultiSelectable?: boolean;
                };
                const groupType = String(d.groupType ?? "").trim() || "__unknown__";
                const multi = d.isMultiSelectable === true;
                return { groupType, multi };
            });
            if (normalized.categoryIds.length > 1) {
                for (let i = 0; i < metas.length; i++) {
                    if (metas[i]!.multi) continue;
                    const gk = metas[i]!.groupType;
                    const sameGroup = metas.filter((m) => m.groupType === gk).length;
                    if (sameGroup > 1) {
                        return NextResponse.json(
                            {
                                success: false,
                                error:
                                    "For categories with isMultiSelectable false, only one selection is allowed per group type.",
                            },
                            { status: 400 },
                        );
                    }
                }
            }
        }

        const newItem = {
            ...normalized,
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
                  const categoryIdsStr = Array.isArray(item.categoryIds)
                      ? item.categoryIds.map(String).join(" ").toLowerCase()
                      : "";
                  const slug = String(item.slug || "").toLowerCase();

                  return (
                      title.includes(search) ||
                      name.includes(search) ||
                      description.includes(search) ||
                      category.includes(search) ||
                      categoryId.includes(search) ||
                      categoryIdsStr.includes(search) ||
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

        const raw =
            body && typeof body === "object"
                ? { ...body, id: undefined, createdAt: undefined }
                : {};
        const mergedForNormalize = {
            ...existing.data(),
            ...raw,
        };
        const normalized = normalizeCreateBody(mergedForNormalize as any);
        const updatePayload = removeUndefinedFields({
            ...normalized,
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

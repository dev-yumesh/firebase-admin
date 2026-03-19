import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";

const COLLECTION = env.FIREBASE_MENU_CATEGORIES_COLLECTION_ID;

const removeUndefinedFields = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

const toIsoDate = (value: any): string | null => {
  if (!value) return null;

  // Firestore Timestamp object from Admin SDK
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  // Plain object form: { _seconds, _nanoseconds }
  if (typeof value._seconds === "number") {
    const ms = value._seconds * 1000 + (value._nanoseconds || 0) / 1_000_000;
    return new Date(ms).toISOString();
  }

  // Already a string or Date
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }

  return null;
};

// Create category
export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();

    if (!body.slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const slug = String(body.slug);
    const existingBySlug = await db
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existingBySlug.empty) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    const docRef = db.collection(COLLECTION).doc();

    await docRef.set({
      ...body,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Category created", id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get single category (by ?id=... or ?slug=...) or paginated list (?page=1&limit=10&search=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    // -------------------------
    // GET Single Category
    // -------------------------
    if (id || slug) {
      let doc: any = null;

      if (id) {
        doc = await db.collection(COLLECTION).doc(String(id)).get();
      } else {
        const matchBySlug = await db
          .collection(COLLECTION)
          .where("slug", "==", String(slug))
          .limit(1)
          .get();

        doc = matchBySlug.empty ? null : matchBySlug.docs[0];
      }

      if (!doc || !doc.exists) {
        return NextResponse.json(
          {
            success: false,
            error: "Not found",
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

    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("sortOrder", "asc")
      .get();

    const allCategories = snapshot.docs.map((doc) => {
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
    const filteredCategories = search
      ? allCategories.filter((category: any) => {
          const title = String(category.title || "").toLowerCase();
          const categorySlug = String(category.slug || "").toLowerCase();
          const description = String(category.description || "").toLowerCase();

          return (
            title.includes(search) ||
            categorySlug.includes(search) ||
            description.includes(search)
          );
        })
      : allCategories;

    const total = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filteredCategories.slice(start, start + limit);

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
// Update category (?id=... or ?slug=...)
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    const slugFromQuery = searchParams.get("slug");
    const body: any = await req.json();
    const id = idFromQuery || body.id;
    const slug = slugFromQuery || body.slug;

    if (!id && !slug) {
      return NextResponse.json(
        { error: "id or slug required" },
        { status: 400 }
      );
    }

    let docRef;
    if (id) {
      docRef = db.collection(COLLECTION).doc(String(id));
    } else {
      const matchBySlug = await db
        .collection(COLLECTION)
        .where("slug", "==", String(slug))
        .limit(1)
        .get();

      if (matchBySlug.empty) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      docRef = matchBySlug.docs[0].ref;
    }

    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatePayload = removeUndefinedFields({
      ...body,
      id: undefined,
      createdAt: undefined,
      updatedAt: serverTimestamp(),
    });

    await docRef.update(updatePayload);

    return NextResponse.json({ message: "Category updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete category (?id=... or ?slug=...)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json(
        { error: "id or slug required" },
        { status: 400 }
      );
    }

    if (id) {
      await db.collection(COLLECTION).doc(String(id)).delete();
      return NextResponse.json({ message: "Category deleted" });
    }

    const matchBySlug = await db
      .collection(COLLECTION)
      .where("slug", "==", String(slug))
      .limit(1)
      .get();

    if (matchBySlug.empty) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await matchBySlug.docs[0].ref.delete();
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

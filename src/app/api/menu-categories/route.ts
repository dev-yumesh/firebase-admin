import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import { env } from "../../../../config/env.config";

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

    const docRef = db.collection(COLLECTION).doc(slug);

    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 }
      );
    }

    await docRef.set({
      ...body,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Category created" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get single category (by ?slug=...) or list all
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const doc = await db.collection(COLLECTION).doc(slug).get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const data: any = doc.data() || {};

      const normalized = {
        id: doc.id,
        slug: doc.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      };

      return NextResponse.json(normalized);
    }

    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("sortOrder", "asc")
      .get();

    const categories = snapshot.docs.map((doc, index) => {
      const data: any = doc.data() || {};

      return {
        id: doc.id ?? index + 1,
        slug: doc.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      };
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update category (?slug=...)
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slugFromQuery = searchParams.get("slug");
    const body: any = await req.json();
    const slug = slugFromQuery || body.slug;

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const docRef = db.collection(COLLECTION).doc(String(slug));

    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatePayload = removeUndefinedFields({
      ...body,
      updatedAt: serverTimestamp(),
    });

    await docRef.update(updatePayload);

    return NextResponse.json({ message: "Category updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete category (?slug=...)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    await db.collection(COLLECTION).doc(String(slug)).delete();
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

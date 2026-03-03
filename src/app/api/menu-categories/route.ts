import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
// import { Category } from "@/types/category";

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();

    if (!body.slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const docRef = db.collection("categories").doc(body.slug);

    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    await docRef.set({
      ...body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Category created" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const doc = await db.collection("categories").doc(params.slug).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const docRef = db.collection("categories").doc(params.slug);

    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await docRef.update({
      ...body,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Category updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await db.collection("categories").doc(params.slug).delete();
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
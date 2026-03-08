import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import { buildUserPayload, normalizeString, toIsoDate } from "@/utils/validators";
import { env } from "@/config/env.config";

const COLLECTION = env.FIREBASE_USER_COLLECTION_ID;

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { errors, payload } = await buildUserPayload(body, true);

    if (errors.length) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const existingByEmail = await db
      .collection(COLLECTION)
      .where("email", "==", payload?.email)
      .limit(1)
      .get();

    if (!existingByEmail.empty) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const normalizedPayload = (payload || {}) as Record<string, any>;
    const docRef = normalizedPayload.id
      ? db.collection(COLLECTION).doc(String(normalizedPayload.id))
      : db.collection(COLLECTION).doc();

    await docRef.set({
      ...normalizedPayload,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      { message: "User created", id: docRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const allUsers = snapshot.docs.map((doc, index) => {
      const data: any = doc.data() || {};

      return {
        id: doc.id ?? index + 1,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      };
    });

    const filteredUsers = search
      ? allUsers.filter((user: any) => {
          const name = String(user.name || "").toLowerCase();
          const email = String(user.email || "").toLowerCase();
          const phone = String(user.phone || "").toLowerCase();
          const role = String(user.role || "").toLowerCase();
          const status = String(user.status || "").toLowerCase();

          return (
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search) ||
            role.includes(search) ||
            status.includes(search)
          );
        })
      : allUsers;

    const total = filteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filteredUsers.slice(start, start + limit);

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

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    const body: any = await req.json();
    const id = normalizeString(idFromQuery || body.id);

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { errors, payload } = await buildUserPayload(body, false);

    if (errors.length) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const docRef = db.collection(COLLECTION).doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (payload.email) {
      const existingByEmail = await db
        .collection(COLLECTION)
        .where("email", "==", payload.email)
        .limit(1)
        .get();

      const duplicateEmail = existingByEmail.docs.find((doc) => doc.id !== id);
      if (duplicateEmail) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
    }

    await docRef.update({
      ...payload,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "User updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

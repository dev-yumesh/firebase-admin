import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { env } from "../../../../config/env.config";

const COLLECTION = env.FIREBASE_USER_COLLECTION_ID;

const toIsoDate = (value: any): string | null => {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (typeof value._seconds === "number") {
    const ms = value._seconds * 1000 + (value._nanoseconds || 0) / 1_000_000;
    return new Date(ms).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
};

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

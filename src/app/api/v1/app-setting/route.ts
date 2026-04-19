import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import {
  buildAppSettingsPayload,
  normalizeString,
  toIsoDate,
} from "@/utils/validators";
import { env } from "@/config/env.config";
import { requireSuperadmin } from "@/lib/apiRouteAuth";

const COLLECTION =
  env.FIREBASE_APP_SETTINGS_COLLECTION_ID;

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
    const authz = await requireSuperadmin(req);
    if (authz instanceof NextResponse) return authz;

    const body: any = await req.json();
    const { errors, payload } = await buildAppSettingsPayload(body, true);

    if (errors.length) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const existingSnapshot = await db
      .collection(COLLECTION)
      .where("key", "==", payload?.key)
      .limit(20)
      .get();
    const duplicate = existingSnapshot.docs.find((doc) => {
      const data: any = doc.data() || {};
      return String(data.platform || "").toUpperCase() === payload?.platform;
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Setting already exists for this key and platform" },
        { status: 400 }
      );
    }

    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({
      ...(payload || {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      { message: "App setting created", id: docRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authz = await requireSuperadmin(req);
    if (authz instanceof NextResponse) return authz;

    const { searchParams } = new URL(req.url);
    const id = normalizeString(searchParams.get("id"));
    const key = normalizeString(searchParams.get("key")).toUpperCase();
    const platform = normalizeString(searchParams.get("platform")).toUpperCase();

    if (id) {
      const doc = await db.collection(COLLECTION).doc(id).get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(normalizeDoc(doc));
    }

    if (key) {
      const snapshot = await db
        .collection(COLLECTION)
        .where("key", "==", key)
        .limit(20)
        .get();
      const doc = snapshot.docs.find((item) => {
        if (!platform) return true;
        const data: any = item.data() || {};
        return String(data.platform || "").toUpperCase() === platform;
      });

      if (!doc) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(normalizeDoc(doc));
    }

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const search = normalizeString(searchParams.get("search")).toLowerCase();
    const statusFilter = normalizeString(searchParams.get("status")).toUpperCase();
    const platformFilter = normalizeString(searchParams.get("platform")).toUpperCase();

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

    const filtered = allItems.filter((item: any) => {
      const matchesSearch =
        !search ||
        String(item.key || "").toLowerCase().includes(search) ||
        String(item.version || "").toLowerCase().includes(search) ||
        String(item.platform || "").toLowerCase().includes(search) ||
        String(item.updateMessage || "").toLowerCase().includes(search);

      const matchesStatus =
        !statusFilter || String(item.status || "").toUpperCase() === statusFilter;
      const matchesPlatform =
        !platformFilter ||
        String(item.platform || "").toUpperCase() === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = filtered.slice(start, start + limit);

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
    const authz = await requireSuperadmin(req);
    if (authz instanceof NextResponse) return authz;

    const { searchParams } = new URL(req.url);
    const body: any = await req.json();
    const id = normalizeString(searchParams.get("id") || body.id);

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const docRef = db.collection(COLLECTION).doc(id);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { errors, payload } = await buildAppSettingsPayload(body, false);
    if (errors.length) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    if (payload.key || payload.platform) {
      const currentData: any = existingDoc.data() || {};
      const nextKey = payload.key || currentData.key;
      const nextPlatform = payload.platform || currentData.platform;

      const duplicateSnapshot = await db
        .collection(COLLECTION)
        .where("key", "==", nextKey)
        .limit(20)
        .get();

      const duplicateDoc = duplicateSnapshot.docs.find((doc) => {
        if (doc.id === id) return false;
        const data: any = doc.data() || {};
        return String(data.platform || "").toUpperCase() === String(nextPlatform || "").toUpperCase();
      });
      if (duplicateDoc) {
        return NextResponse.json(
          { error: "Setting already exists for this key and platform" },
          { status: 400 }
        );
      }
    }

    await docRef.update({
      ...payload,
      updatedAt: serverTimestamp(),
    });
    return NextResponse.json({ message: "App setting updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authz = await requireSuperadmin(req);
    if (authz instanceof NextResponse) return authz;

    const { searchParams } = new URL(req.url);
    const id = normalizeString(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const docRef = db.collection(COLLECTION).doc(id);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ message: "App setting deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import { env } from "../../../../config/env.config";

const COLLECTION =
  env.FIREBASE_APP_SETTINGS_COLLECTION_ID;

const ALLOWED_PLATFORM = new Set(["ALL", "ANDROID", "IOS", "WEB"]);
const ALLOWED_STATUS = new Set(["ACTIVE", "INACTIVE"]);
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

const removeUndefinedFields = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

const normalizeString = (value: any) =>
  typeof value === "string" ? value.trim() : "";

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

const validateSemver = (value: string) => SEMVER_REGEX.test(value);

const buildAppSettingsPayload = (body: any, isCreate: boolean) => {
  const errors: string[] = [];

  const key = normalizeString(body.key).toUpperCase();
  const platform = normalizeString(
    body.platform || (isCreate ? "ALL" : "")
  ).toUpperCase();
  const version = normalizeString(body.version);
  const minSupportedVersion = normalizeString(body.minSupportedVersion);
  const status = normalizeString(
    body.status || (isCreate ? "ACTIVE" : "")
  ).toUpperCase();

  const forceUpdateRaw = body.forceUpdate;
  const maintenanceModeRaw = body.maintenanceMode;
  const latestBuildNumberRaw = body.latestBuildNumber;

  if (isCreate || body.key !== undefined) {
    if (!key) {
      errors.push("key is required");
    }
  }

  if (isCreate || body.version !== undefined) {
    if (!version) {
      errors.push("version is required");
    } else if (!validateSemver(version)) {
      errors.push("version must be a valid semver like 1.0.0");
    }
  }

  if (minSupportedVersion && !validateSemver(minSupportedVersion)) {
    errors.push(
      "minSupportedVersion must be a valid semver like 1.0.0"
    );
  }

  if (isCreate || body.forceUpdate !== undefined) {
    if (typeof forceUpdateRaw !== "boolean") {
      errors.push("forceUpdate must be boolean");
    }
  }

  if (
    maintenanceModeRaw !== undefined &&
    typeof maintenanceModeRaw !== "boolean"
  ) {
    errors.push("maintenanceMode must be boolean");
  }

  if (platform && !ALLOWED_PLATFORM.has(platform)) {
    errors.push("platform must be one of ALL, ANDROID, IOS, WEB");
  }

  if (status && !ALLOWED_STATUS.has(status)) {
    errors.push("status must be one of ACTIVE, INACTIVE");
  }

  if (latestBuildNumberRaw !== undefined) {
    const numericBuild = Number(latestBuildNumberRaw);
    if (!Number.isFinite(numericBuild) || numericBuild < 0) {
      errors.push("latestBuildNumber must be a positive number");
    }
  }

  const releaseDate = normalizeString(body.releaseDate);
  if (releaseDate && Number.isNaN(new Date(releaseDate).getTime())) {
    errors.push("releaseDate must be a valid date string");
  }

  if (errors.length) {
    return { errors, payload: null };
  }

  const payload = removeUndefinedFields({
    key: body.key !== undefined || isCreate ? key : undefined,
    platform: body.platform !== undefined || isCreate ? platform : undefined,
    version: body.version !== undefined || isCreate ? version : undefined,
    minSupportedVersion:
      body.minSupportedVersion !== undefined ? minSupportedVersion : undefined,
    forceUpdate: body.forceUpdate,
    maintenanceMode: body.maintenanceMode,
    latestBuildNumber:
      body.latestBuildNumber !== undefined
        ? Number(body.latestBuildNumber)
        : undefined,
    title: body.title !== undefined ? normalizeString(body.title) : undefined,
    updateMessage:
      body.updateMessage !== undefined
        ? normalizeString(body.updateMessage)
        : undefined,
    downloadUrl:
      body.downloadUrl !== undefined ? normalizeString(body.downloadUrl) : undefined,
    status: body.status !== undefined || isCreate ? status : undefined,
    releaseDate: body.releaseDate !== undefined ? releaseDate : undefined,
  });

  if (isCreate) {
    return {
      errors: [],
      payload: {
        ...payload,
        forceUpdate: payload.forceUpdate ?? false,
        maintenanceMode: payload.maintenanceMode ?? false,
        latestBuildNumber: payload.latestBuildNumber ?? 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    };
  }

  return {
    errors: [],
    payload: removeUndefinedFields({
      ...payload,
      createdAt: undefined,
      updatedAt: serverTimestamp(),
    }),
  };
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
    const body: any = await req.json();
    const { errors, payload } = buildAppSettingsPayload(body, true);

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
    await docRef.set(payload || {});

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

    const { errors, payload } = buildAppSettingsPayload(body, false);
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

    await docRef.update(payload);
    return NextResponse.json({ message: "App setting updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
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

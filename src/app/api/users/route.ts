import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import { env } from "../../../../config/env.config";

const COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const ALLOWED_ROLES = new Set(["CUSTOMER", "OWNER", "ADMIN"]);
const ALLOWED_STATUS = new Set(["ACTIVE", "INACTIVE"]);

const removeUndefinedFields = (obj: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  );

const normalizeString = (value: any) =>
  typeof value === "string" ? value.trim() : "";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone: string) =>
  /^\+?[0-9\s-]{7,15}$/.test(phone);

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

const validateUserAddress = (userAddress: any, errors: string[]) => {
  if (!userAddress) return;

  if (typeof userAddress !== "object" || Array.isArray(userAddress)) {
    errors.push("userAddress must be an object");
    return;
  }

  if (
    userAddress.latitude !== undefined &&
    !Number.isFinite(Number(userAddress.latitude))
  ) {
    errors.push("userAddress.latitude must be a number");
  }

  if (
    userAddress.longitude !== undefined &&
    !Number.isFinite(Number(userAddress.longitude))
  ) {
    errors.push("userAddress.longitude must be a number");
  }
};

const buildUserPayload = (body: any, isCreate: boolean) => {
  const errors: string[] = [];

  const name = normalizeString(body.name);
  const email = normalizeString(body.email).toLowerCase();
  const phone = normalizeString(body.phone);
  const role = normalizeString(body.role || (isCreate ? "CUSTOMER" : "")).toUpperCase();
  const status = normalizeString(body.status || (isCreate ? "ACTIVE" : "")).toUpperCase();
  const language = normalizeString(body.language || (isCreate ? "en" : ""));
  const password = normalizeString(body.password);

  if (isCreate || body.name !== undefined) {
    if (!name) errors.push("name is required");
  }

  if (isCreate || body.email !== undefined) {
    if (!email) {
      errors.push("email is required");
    } else if (!isValidEmail(email)) {
      errors.push("email is invalid");
    }
  }

  if (isCreate || body.password !== undefined) {
    if (!password) {
      errors.push("password is required");
    } else if (password.length < 6) {
      errors.push("password must be at least 6 characters");
    }
  }

  if (phone && !isValidPhone(phone)) {
    errors.push("phone is invalid");
  }

  if (role && !ALLOWED_ROLES.has(role)) {
    errors.push("role must be one of CUSTOMER, OWNER, ADMIN");
  }

  if (status && !ALLOWED_STATUS.has(status)) {
    errors.push("status must be one of ACTIVE, INACTIVE");
  }

  validateUserAddress(body.userAddress, errors);

  if (errors.length) {
    return { errors, payload: null };
  }

  const normalizedId =
    body.id !== undefined ? normalizeString(body.id) : undefined;

  const payload = removeUndefinedFields({
    id: normalizedId || undefined,
    name: body.name !== undefined || isCreate ? name : undefined,
    email: body.email !== undefined || isCreate ? email : undefined,
    phone: body.phone !== undefined ? phone : undefined,
    role: body.role !== undefined || isCreate ? role : undefined,
    language: body.language !== undefined || isCreate ? language : undefined,
    photo: body.photo,
    photoURL: body.photoURL,
    address: body.address,
    userAddress: body.userAddress,
    isEmailVerified: body.isEmailVerified,
    isPhoneVerified: body.isPhoneVerified,
    isActive: body.isActive,
    status: body.status !== undefined || isCreate ? status : undefined,
    coins: body.coins,
    availableCoins: body.availableCoins,
    coinbalance: body.coinbalance,
  });

  if (isCreate) {
    return {
      errors: [],
      payload: {
        ...payload,
        isEmailVerified: payload.isEmailVerified ?? false,
        isPhoneVerified: payload.isPhoneVerified ?? false,
        isActive: payload.isActive ?? true,
        coins: payload.coins ?? 0,
        availableCoins: payload.availableCoins ?? 0,
        coinbalance: payload.coinbalance ?? 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    };
  }

  return {
    errors: [],
    payload: removeUndefinedFields({
      ...payload,
      id: undefined,
      createdAt: undefined,
      updatedAt: serverTimestamp(),
    }),
  };
};

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { errors, payload } = buildUserPayload(body, true);

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

    const docRef = payload?.id
      ? db.collection(COLLECTION).doc(payload?.id)
      : db.collection(COLLECTION).doc();

    await docRef.set({
      ...payload,
      id: docRef.id,
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

    const { errors, payload } = buildUserPayload(body, false);

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

    await docRef.update(payload);

    return NextResponse.json({ message: "User updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

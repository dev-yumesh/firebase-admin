import { NextRequest, NextResponse } from "next/server";
import { db, serverTimestamp } from "@/lib/firebaseAdmin";
import {
  shopOwnerShopRegistrationSchema,
  toIsoDate,
  userCreateSchema,
} from "@/utils/validators";
import { env } from "@/config/env.config";
import { USER_ROLES } from "@/constants/enums";
import {
  formatRegistrationError,
  registerUserWithOptionalShop,
} from "@/lib/userRegistrationService";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FB_SHOP_COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, unknown> = await req.json();
    const userData = body.userData as Record<string, unknown> | undefined;
    const shopData = body.shopData as Record<string, unknown> | undefined;

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User details are required" },
        { status: 400 },
      );
    }

    if (userData.role === USER_ROLES.OWNER && !shopData) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop details are required for owner",
        },
        { status: 400 },
      );
    }

    const userValidationResult = await userCreateSchema.validate(userData);

    const shopValidationResult =
      userValidationResult.role === USER_ROLES.OWNER && shopData
        ? await shopOwnerShopRegistrationSchema.validate(shopData)
        : null;

    const result = await registerUserWithOptionalShop(
      userValidationResult,
      shopValidationResult,
      shopValidationResult && shopData
        ? {
            logoURL: (shopData.logoURL as string | null | undefined) ?? null,
            bannerImageURL:
              (shopData.bannerImageURL as string | null | undefined) ?? null,
          }
        : undefined,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.log("error in user create", error);
    const { status, body: errBody } = formatRegistrationError(error);
    return NextResponse.json(errBody, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const docById = await db
        .collection(FB_USER_COLLECTION)
        .doc(String(id))
        .get();
      let doc: any = docById;

      if (!docById.exists) {
        const snapshot = await db
          .collection(FB_USER_COLLECTION)
          .where("uid", "==", String(id))
          .limit(1)
          .get();

        if (snapshot.empty) {
          return NextResponse.json(
            {
              success: false,
              error: "User not found",
            },
            { status: 404 },
          );
        }

        doc = snapshot.docs[0];
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

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const snapshot = await db
      .collection(FB_USER_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const allUsers = snapshot.docs.map((d) => {
      const data: Record<string, unknown> = d.data() || {};

      return {
        id: d.id,
        ...data,
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
      };
    });

    const filteredUsers = search
      ? allUsers.filter((user: Record<string, unknown>) => {
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const { userDocId, updateUserData, updateShopData } = body;

    if (!userDocId) {
      return NextResponse.json(
        { success: false, error: "User UID is required" },
        { status: 400 },
      );
    }

    if (!updateUserData || !updateShopData) {
      return NextResponse.json(
        { success: false, error: "Update data required" },
        { status: 400 },
      );
    }

    if (updateUserData.email || updateUserData.phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and phone cannot be updated",
        },
        { status: 400 },
      );
    }

    const userDocRef = db.collection(FB_USER_COLLECTION).doc(userDocId);
    const userDoc = await userDocRef.get();

    const shopDocRef = db
      .collection(FB_SHOP_COLLECTION)
      .doc(updateShopData?.id);
    const shopDoc = await shopDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "User document not found",
        },
        { status: 404 },
      );
    }

    if (!shopDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop document not found",
        },
        { status: 404 },
      );
    }

    await userDocRef.update({
      ...updateUserData,
      updatedAt: serverTimestamp(),
    });

    await shopDocRef.update({
      ...updateShopData,
      updatedAt: serverTimestamp(),
    });

    const updatedUserDoc = (await userDocRef.get()).data();
    const updatedShopDoc = (await shopDocRef.get()).data();

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: { userData: updatedUserDoc, shopData: updatedShopDoc },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.log("error in user update", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong",
      },
      { status: 500 },
    );
  }
}

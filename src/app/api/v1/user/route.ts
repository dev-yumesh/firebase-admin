import { NextRequest, NextResponse } from "next/server";
import { db, auth, serverTimestamp } from "@/lib/firebaseAdmin";
import {
  buildUserPayload,
  normalizeString,
  shopCreateSchema,
  toIsoDate,
  userCreateSchema,
  userUpdateSchema,
} from "@/utils/validators";
import { env } from "@/config/env.config";
import { APP_LANGUAGE, USER_ROLES } from "@/constants/enums";
import QRCode from "qrcode";
import { constructQRURL } from "@/utils";
import { storage, ID } from "@/lib/appwriteServices";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FB_SHOP_COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { userData, shopData } = body;

    // -------------------------
    // Basic validation
    // -------------------------
    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User details are required",
        },
        { status: 400 }
      );
    }

    if (userData?.role === USER_ROLES.OWNER && !shopData) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop details are required for owner",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // Validate user data
    // -------------------------
    const userValidationResult = await userCreateSchema.validate(userData);

    // -------------------------
    // Create Firebase Auth user
    // -------------------------
    const authUserResult = await auth.createUser({
      email: userValidationResult.email,
      password: userValidationResult.password,
      displayName: userValidationResult.name,
      phoneNumber: "+91" + userValidationResult.phone,
    });

    if (!authUserResult) {
      return NextResponse.json(
        {
          success: false,
          error: "User not created",
        },
        { status: 400 }
      );
    }

    // -------------------------
    // Save user in Firestore
    // -------------------------
    const savedUserRef = await db.collection(FB_USER_COLLECTION).add({
      uid: authUserResult.uid,
      name: userValidationResult.name,
      email: userValidationResult.email,
      phone: userValidationResult.phone,
      role: userValidationResult.role,
      isActive: true,
      isEmailVerified: false,
      isPhoneVerified: false,
      status: "ACTIVE",
      language: APP_LANGUAGE.EN,
      availableWalletBalance: 0,
      address: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    let shopResponse: any = null;

    // -------------------------
    // If OWNER then create shop
    // -------------------------
    if (userValidationResult.role === USER_ROLES.OWNER) {
      const shopValidationResult = await shopCreateSchema.validate(shopData);

      const savedShopRef = await db.collection(FB_SHOP_COLLECTION).add({
        isActive: true,
        status: "ACTIVE",
        availableWalletBalance: 0,
        address: null,
        shopName: shopValidationResult.shopName,
        shopType: shopValidationResult.shopType,
        hasSeating: shopValidationResult.hasSeating,
        totalFloors: shopValidationResult.totalFloors,
        isVerified: false,
        logoURL: shopData.logoURL || null,
        bannerImageURL: shopData.bannerImageURL || null,
        ownerUID: authUserResult.uid,
        shopQR: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPrimary: true
      });

      // -------------------------
      // Generate QR
      // -------------------------
      const qrURL = constructQRURL({
        entityName: shopValidationResult.shopName,
        entityType: "SHOP",
        entityId: savedShopRef.id,
      });

      const shopQRBase64 = await QRCode.toDataURL(qrURL);
      const base64Data = shopQRBase64.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const uploadedFile = await storage.createFile(
        env.APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        new File(
          [buffer],
          `qr_${shopValidationResult.shopName.replace(/\s+/g, "_")}_${Date.now()}.png`,
          {
            type: "image/png",
          }
        )
      );

      const qrImageURL = `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${env.APPWRITE_PROJECT_ID}`;

      // Update shop with QR
      await db.collection(FB_SHOP_COLLECTION).doc(savedShopRef.id).update({
        shopQR: qrImageURL,
      });

      shopResponse = {
        id: savedShopRef.id,
        ...shopValidationResult,
        shopQR: qrImageURL,
      };
    }

    // -------------------------
    // Success Response
    // -------------------------
    return NextResponse.json(
      {
        success: true,
        message: "User and Shop Created Successfully",
        data: {
          user: {
            id: savedUserRef.id,
            uid: authUserResult.uid,
            ...userValidationResult,
          },
          shop: shopResponse,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {

    console.log("error in user create", error);

    // Firebase phone duplicate
    if (error.code === "auth/phone-number-already-exists") {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number already registered",
          errorCode: "PHONE_EXISTS"
        },
        { status: 400 }
      );
    }

    // Firebase email duplicate
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          errorCode: "EMAIL_EXISTS"
        },
        { status: 400 }
      );
    }

    // Validation error
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong",
        errorCode: "SERVER_ERROR"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // -------------------------
    // GET Single User by document id or UID
    // -------------------------
    if (id) {
      const docById = await db.collection(FB_USER_COLLECTION).doc(String(id)).get();
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
            { status: 404 }
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
      .collection(FB_USER_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const allUsers = snapshot.docs.map((doc) => {
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();


    const { userDocId, updateUserData, updateShopData } = body;

    if (!userDocId) {
      return NextResponse.json(
        { success: false, error: "User UID is required" },
        { status: 400 }
      );
    }

    if (!updateUserData || !updateShopData ) {
      return NextResponse.json(
        { success: false, error: "Update data required" },
        { status: 400 }
      );
    }

    // ❌ Block email & phone updates
    if (updateUserData.email || updateUserData.phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and phone cannot be updated",
        },
        { status: 400 }
      );
    }

    // --------------------------------
    // Update Firebase Auth
    // --------------------------------
    // await auth.updateUser(userUId, {
    //   displayName: updateData.name,
    //   photoURL: updateData.photoURL,
    // });

    // --------------------------------
    // Check if Firestore doc exists
    // --------------------------------
    const userDocRef = db.collection(FB_USER_COLLECTION).doc(userDocId);
    const userDoc = await userDocRef.get();

    const shopDocRef = db.collection(FB_SHOP_COLLECTION).doc(updateShopData?.id);
    const shopDoc = await shopDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "User document not found",
        },
        { status: 404 }
      );
    }

    if (!shopDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop document not found",
        },
        { status: 404 }
      );
    }

     

    // --------------------------------
    // Update Firestore
    // --------------------------------
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
        data: { userData: updatedUserDoc, shopData :updatedShopDoc}
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("error in user update", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
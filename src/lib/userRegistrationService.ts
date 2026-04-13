import { db, auth, serverTimestamp } from "@/lib/firebaseAdmin";
import { uploadBufferWithReadUrl } from "@/lib/firebaseAdminStorage";
import { ID } from "@/lib/storageId";
import { env } from "@/config/env.config";
import { APP_LANGUAGE, USER_ROLES } from "@/constants/enums";
import { constructQRURL } from "@/utils";
import type { InferType } from "yup";
import { shopCreateSchemaWithLocation, userCreateSchema } from "@/utils/validators";
import QRCode from "qrcode";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FB_SHOP_COLLECTION = env.FIREBASE_SHOP_COLLECTION_ID;

type UserValidated = InferType<typeof userCreateSchema>;
type ShopWithLocation = InferType<typeof shopCreateSchemaWithLocation>;

type ShopLocationInput = NonNullable<ShopWithLocation["location"]>;

function buildShopAddressDoc(shopId: string, loc: ShopLocationInput) {
  const nowIso = new Date().toISOString();
  return {
    id: `${shopId}_addr`,
    city: loc.city,
    pincode: loc.pincode ?? "",
    locality: loc.locality ?? "",
    latitude: loc.latitude,
    longitude: loc.longitude,
    state: loc.state,
    country: "India" as const,
    referenceId: shopId,
    referenceType: "SHOP" as const,
    googleMapLocation: loc.googleMapLocation ?? "",
    createdAt: nowIso,
    updatedAt: nowIso,
    isActive: true,
    isDeleted: false,
    isVerified: false,
  };
}

export type RegistrationSuccessBody = {
  success: true;
  message: string;
  data: {
    user: {
      id: string;
      uid: string;
      name: string;
      email: string;
      phone?: string;
      role: string;
    };
    shop: {
      id: string;
      shopName: string;
      shopType: string;
      hasSeating: boolean;
      totalFloors: number;
      shopQR: string;
    } | null;
  };
};

export async function registerUserWithOptionalShop(
  userValidationResult: UserValidated,
  shopValidationResult: ShopWithLocation | null,
  shopExtras?: { logoURL?: string | null; bannerImageURL?: string | null },
): Promise<RegistrationSuccessBody> {
  if (userValidationResult.role === USER_ROLES.OWNER) {
    if (!shopValidationResult?.location) {
      throw Object.assign(
        new Error("Owner registration requires shop data with location"),
        { code: "OWNER_SHOP_REQUIRED", name: "ValidationError" },
      );
    }
  }

  const createAuthPayload: Parameters<typeof auth.createUser>[0] = {
    email: userValidationResult.email,
    password: userValidationResult.password,
    displayName: userValidationResult.name,
  };
  if (userValidationResult.phone) {
    const p = String(userValidationResult.phone).trim();
    createAuthPayload.phoneNumber = p.startsWith("+") ? p : `+91${p}`;
  }

  const authUserResult = await auth.createUser(createAuthPayload);

  if (!authUserResult) {
    throw Object.assign(new Error("User not created"), { code: "AUTH_CREATE_FAILED" });
  }

  const savedUserRef = await db.collection(FB_USER_COLLECTION).add({
    uid: authUserResult.uid,
    name: userValidationResult.name,
    email: userValidationResult.email,
    phone: userValidationResult.phone ?? null,
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

  let shopResponse: RegistrationSuccessBody["data"]["shop"] = null;

  if (userValidationResult.role === USER_ROLES.OWNER && shopValidationResult) {
    const { location, ...shopCore } = shopValidationResult;

    const savedShopRef = await db.collection(FB_SHOP_COLLECTION).add({
      isActive: true,
      status: "ACTIVE",
      availableWalletBalance: 0,
      address: null,
      shopName: shopCore.shopName,
      shopType: shopCore.shopType,
      hasSeating: shopCore.hasSeating,
      totalFloors: shopCore.totalFloors,
      isVerified: false,
      logoURL: shopExtras?.logoURL ?? null,
      bannerImageURL: shopExtras?.bannerImageURL ?? null,
      ownerUID: authUserResult.uid,
      ownerId: savedUserRef.id,
      likesCount: 0,
      shopQR: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPrimary: true,
    });

    if (location) {
      await db
        .collection(FB_SHOP_COLLECTION)
        .doc(savedShopRef.id)
        .update({
          address: buildShopAddressDoc(savedShopRef.id, location),
        });
    }

    const qrURL = constructQRURL({
      entityName: shopCore.shopName,
      entityType: "SHOP",
      entityId: savedShopRef.id,
    });

    const shopQRBase64 = await QRCode.toDataURL(qrURL);
    const base64Data = shopQRBase64.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const qrFileName = `qr_${shopCore.shopName.replace(/\s+/g, "_")}_${Date.now()}.png`;
    const qrPath = `shop-qrs/${savedShopRef.id}/${ID.unique()}_${qrFileName}`;
    const qrImageURL = await uploadBufferWithReadUrl(
      buffer,
      qrPath,
      "image/png",
    );

    await db.collection(FB_SHOP_COLLECTION).doc(savedShopRef.id).update({
      shopQR: qrImageURL,
    });

    shopResponse = {
      id: savedShopRef.id,
      shopName: shopCore.shopName,
      shopType: shopCore.shopType,
      hasSeating: shopCore.hasSeating,
      totalFloors: shopCore.totalFloors,
      shopQR: qrImageURL,
    };
  }

  return {
    success: true,
    message: "User and Shop Created Successfully",
    data: {
      user: {
        id: savedUserRef.id,
        uid: authUserResult.uid,
        name: userValidationResult.name,
        email: userValidationResult.email,
        phone: userValidationResult.phone ?? undefined,
        role: userValidationResult.role,
      },
      shop: shopResponse,
    },
  };
}

export function formatRegistrationError(error: unknown): {
  status: number;
  body: {
    success: false;
    error: string;
    errorCode?: string;
  };
} {
  const err = error as { code?: string; name?: string; message?: string };

  if (err.code === "auth/phone-number-already-exists") {
    return {
      status: 400,
      body: {
        success: false,
        error: "Phone number already registered",
        errorCode: "PHONE_EXISTS",
      },
    };
  }

  if (err.code === "auth/email-already-exists") {
    return {
      status: 400,
      body: {
        success: false,
        error: "Email already registered",
        errorCode: "EMAIL_EXISTS",
      },
    };
  }

  if (err.name === "ValidationError") {
    return {
      status: 400,
      body: {
        success: false,
        error: err.message || "Validation failed",
        errorCode: "VALIDATION_ERROR",
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: "Something went wrong",
      errorCode: "SERVER_ERROR",
    },
  };
}

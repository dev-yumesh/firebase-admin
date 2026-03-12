import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;
const FIREBASE_API_KEY = env.FIREBASE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { emailOrPhone, password } = body;

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email/Mobile and password are required",
        },
        { status: 400 }
      );
    }

    let email = emailOrPhone;

    // -------------------------
    // If mobile number provided
    // -------------------------
    const isPhone = /^[0-9]{10}$/.test(emailOrPhone);

    if (isPhone) {
      const snapshot = await db
        .collection(FB_USER_COLLECTION)
        .where("phone", "==", emailOrPhone)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return NextResponse.json(
          {
            success: false,
            error: "User not found with this phone number",
          },
          { status: 404 }
        );
      }

      email = snapshot.docs[0].data().email;
    }

    // -------------------------
    // Firebase Auth Login
    // -------------------------
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: firebaseData.error?.message || "Invalid credentials",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        uid: firebaseData.localId,
        email: firebaseData.email,
        idToken: firebaseData.idToken,
        refreshToken: firebaseData.refreshToken,
        expiresIn: firebaseData.expiresIn,
      },
    });
  } catch (error: any) {
    console.log("login error", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
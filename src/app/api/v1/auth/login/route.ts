import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { env } from "@/config/env.config";
import { loginSchema } from "@/utils/validators";

const FB_USER_COLLECTION = env.FIREBASE_USER_COLLECTION_ID;

const FIREBASE_SIGN_IN_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

function mapFirebaseAuthError(code: string | undefined): string {
  switch (code) {
    case "EMAIL_NOT_FOUND":
      return "No account found for this email.";
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Invalid email or password.";
    case "USER_DISABLED":
      return "This account has been disabled.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Try again later.";
    default:
      return "Sign in failed. Please try again.";
  }
}

function dashboardPathForRole(role: string | undefined): string {
  const r = (role || "").toUpperCase();
  if (r === "SUPERADMIN" || r === "ADMIN") {
    return "/superadmin/dashboard";
  }
  if (r === "OWNER" || r === "MANAGER") {
    return "/admin/dashboard";
  }
  return "/admin/dashboard";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email, password } = await loginSchema.validate(json);

    if (!env.FIREBASE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Auth is not configured." },
        { status: 500 },
      );
    }

    const idRes = await fetch(
      `${FIREBASE_SIGN_IN_URL}?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    const idJson = (await idRes.json()) as {
      idToken?: string;
      refreshToken?: string;
      expiresIn?: string;
      localId?: string;
      email?: string;
      error?: { message?: string; errors?: { message?: string }[] };
    };

    if (!idRes.ok || !idJson.idToken || !idJson.localId) {
      const code =
        idJson.error?.message ||
        idJson.error?.errors?.[0]?.message ||
        "UNKNOWN";
      return NextResponse.json(
        {
          success: false,
          error: mapFirebaseAuthError(code),
          errorCode: code,
        },
        { status: 401 },
      );
    }

    const uid = idJson.localId;
    let firestoreId: string | undefined;
    let role: string | undefined;
    let name: string | undefined;

    const snap = await db
      .collection(FB_USER_COLLECTION)
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0]!;
      firestoreId = doc.id;
      const data = doc.data() as Record<string, unknown>;
      role = typeof data.role === "string" ? data.role : undefined;
      name = typeof data.name === "string" ? data.name : undefined;
    }

    const redirectTo = dashboardPathForRole(role);

    return NextResponse.json(
      {
        success: true,
        data: {
          idToken: idJson.idToken,
          refreshToken: idJson.refreshToken ?? "",
          expiresIn: idJson.expiresIn ?? "3600",
          user: {
            uid,
            email: idJson.email ?? email,
            role,
            firestoreId,
            name,
          },
          redirectTo,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    if (err.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: err.message || "Validation failed" },
        { status: 400 },
      );
    }
    console.error("login route error", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}

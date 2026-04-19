import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env.config";
import {
  dashboardPathForRole,
  evaluateSessionAfterAuth,
  sessionGateErrorMessage,
} from "@/lib/accountSessionGate";
import { tryBootstrapSuperadminProfile } from "@/lib/superadminBootstrap";
import { loginSchema } from "@/utils/validators";

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
    let gate = await evaluateSessionAfterAuth(uid);

    if (!gate.ok && gate.code === "NO_FIRESTORE_PROFILE") {
      const bootstrapped = await tryBootstrapSuperadminProfile(uid, email);
      if (bootstrapped) {
        gate = await evaluateSessionAfterAuth(uid);
      }
    }

    if (!gate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: sessionGateErrorMessage(gate.code),
          errorCode: gate.code,
        },
        { status: 403 },
      );
    }

    const { firestoreId, role, name } = gate;
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

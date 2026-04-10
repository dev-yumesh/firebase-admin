import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In | Recipe Book Admin",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Loading…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}

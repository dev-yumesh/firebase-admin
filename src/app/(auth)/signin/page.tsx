import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In | Recipe Book Admin",
};

export default function SignInPage() {
  return <SignInForm />;
}

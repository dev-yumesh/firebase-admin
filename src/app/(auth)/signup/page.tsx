import type { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up | Recipe Book Admin",
};

export default function SignUpPage() {
  return <SignUpForm />;
}

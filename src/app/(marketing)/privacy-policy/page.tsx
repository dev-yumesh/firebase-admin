import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Recipe Book",
  description: "How Recipe Book handles your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-4 text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="leading-relaxed">
        This is a placeholder privacy policy for visitors. Add your legal text,
        data retention rules, and contact for privacy requests before going to
        production.
      </p>
      <p className="leading-relaxed">
        Public pages like this stay outside the admin shell so they load without
        the dashboard sidebar or header.
      </p>
    </article>
  );
}

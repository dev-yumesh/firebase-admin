import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Recipe Book",
  description: "Learn about Recipe Book and our mission for food vendors.",
};

export default function AboutPage() {
  return (
    <article className="space-y-4 text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        About Us
      </h1>
      <p className="leading-relaxed">
        Recipe Book helps food stalls and small restaurants run digital menus,
        QR ordering, and token workflows from one place.
      </p>
      <p className="leading-relaxed">
        This page is public and does not require authentication. Replace this
        copy with your company story, team, and contact details when you are
        ready.
      </p>
    </article>
  );
}

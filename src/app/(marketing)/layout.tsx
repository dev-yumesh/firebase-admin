import Link from "next/link";
import React from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-800 dark:text-white"
          >
            Recipe Book
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/about" className="hover:text-brand-500">
              About
            </Link>
            <Link href="/privacy-policy" className="hover:text-brand-500">
              Privacy
            </Link>
            <Link href="/signin" className="hover:text-brand-500">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}

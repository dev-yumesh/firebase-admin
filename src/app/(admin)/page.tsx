import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Recipebook Admin",
  description: "Landing page for Recipebook admin panel",
};

export default function HomeHeroPage() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
        <div className="inline-flex w-fit items-center rounded-full border border-gray-300 bg-white/70 px-4 py-1 text-xs font-medium tracking-wide text-gray-700 backdrop-blur dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300">
          Recipebook Admin Portal
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-6xl">
          Manage your platform from one focused dashboard.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg">
          Open the admin dashboard to manage users, shops, categories, and app
          settings with the full sidebar navigation.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Open Dashboard
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Sign In
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute right-[-80px] top-[-60px] h-80 w-80 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/20" />
      <div className="pointer-events-none absolute bottom-[-90px] left-[-120px] h-96 w-96 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/20" />
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10">
        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 md:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Users
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Track and manage account data quickly.
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Shops
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Review shop setup, owners, and status.
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Control app versions and release behavior.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

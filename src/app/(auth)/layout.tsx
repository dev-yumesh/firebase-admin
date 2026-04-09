import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center bg-gray-50 dark:bg-gray-900 lg:flex-row">
      {children}
    </div>
  );
}

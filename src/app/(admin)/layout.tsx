"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen overflow-x-hidden xl:flex">
      {!isLandingPage && (
        <>
          <AppSidebar />
          <Backdrop />
        </>
      )}
      <div
        className={`min-w-0 flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${
          isLandingPage ? "ml-0" : mainContentMargin
        }`}
      >
        {!isLandingPage && <AppHeader />}
        <div
          className={
            isLandingPage
              ? "min-h-screen"
              : "mx-auto min-w-0 max-w-(--breakpoint-2xl) p-4 md:p-6"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

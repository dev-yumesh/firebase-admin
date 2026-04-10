"use client";

import { PanelBaseProvider, type PanelRole } from "@/context/PanelBaseContext";
import { useSidebar } from "@/context/SidebarContext";
import { readAuthSession } from "@/lib/authSession";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

function resolvePanelContext(pathname: string): {
  basePath: string;
  role: PanelRole;
} {
  if (pathname.startsWith("/superadmin")) {
    return { basePath: "/superadmin", role: "superadmin" };
  }
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    const role = readAuthSession()?.user?.role?.toUpperCase() ?? "";
    if (role === "SUPERADMIN" || role === "ADMIN") {
      return { basePath: "/superadmin", role: "superadmin" };
    }
  }
  return { basePath: "/admin", role: "admin" };
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [panelCtx, setPanelCtx] = useState(() => resolvePanelContext(pathname));

  useEffect(() => {
    setPanelCtx(resolvePanelContext(pathname));
  }, [pathname]);

  const { basePath, role } = panelCtx;
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <PanelBaseProvider basePath={basePath} role={role}>
      <div className="min-h-screen overflow-x-hidden xl:flex">
        <AppSidebar />
        <Backdrop />
        <div
          className={`min-w-0 flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div className="mx-auto min-w-0 max-w-(--breakpoint-2xl) p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </PanelBaseProvider>
  );
}

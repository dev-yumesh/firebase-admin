"use client";

import React, { createContext, useContext } from "react";

export type PanelRole = "superadmin" | "admin";

type PanelBaseValue = {
  basePath: string;
  role: PanelRole;
};

const PanelBaseContext = createContext<PanelBaseValue | null>(null);

export function PanelBaseProvider({
  basePath,
  role,
  children,
}: {
  basePath: string;
  role: PanelRole;
  children: React.ReactNode;
}) {
  return (
    <PanelBaseContext.Provider value={{ basePath, role }}>
      {children}
    </PanelBaseContext.Provider>
  );
}

export function usePanelBase() {
  const ctx = useContext(PanelBaseContext);
  if (!ctx) {
    throw new Error("usePanelBase must be used under a panel role layout");
  }
  return ctx;
}

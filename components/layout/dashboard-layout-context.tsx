"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "dashboard-sidebar-collapsed";

interface DashboardLayoutContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null);

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    }
  }, [collapsed, hydrated]);

  const toggleCollapsed = () => setCollapsed((current) => !current);

  return (
    <DashboardLayoutContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error("useDashboardLayout must be used within DashboardLayoutProvider");
  }
  return context;
}

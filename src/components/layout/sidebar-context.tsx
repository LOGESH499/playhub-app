"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "playhub-sidebar-collapsed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("playhub-sidebar-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("playhub-sidebar-change", callback);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

function writeCollapsed(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new Event("playhub-sidebar-change"));
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((value: boolean) => {
    writeCollapsed(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    writeCollapsed(!getSnapshot());
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

"use client";
import { useEffect } from "react";
import { loadSettings, applyTheme } from "@/lib/settings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const s = loadSettings();
    applyTheme(s);
    document.documentElement.setAttribute("data-fontsize", s.fontSize);
  }, []);
  return <>{children}</>;
}

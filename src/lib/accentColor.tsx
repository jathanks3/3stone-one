"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Reuses the exact palette already designed for each edition's own brand
// accent (see globals.css's .edition-workspace/.edition-student) rather
// than inventing new colors - "default" means "use this workspace's own
// edition color," anything else is an explicit user override.
export type AccentColor = "default" | "blue" | "green" | "purple";

export const ACCENT_COLOR_STORAGE_KEY = "threestone-accent-color";

interface AccentColorContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null);

function readInitialAccentColor(): AccentColor {
  if (typeof window === "undefined") return "default";
  const stored = window.localStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
  return stored === "blue" || stored === "green" || stored === "purple" ? stored : "default";
}

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(readInitialAccentColor);

  const setAccentColor = useCallback((next: AccentColor) => {
    setAccentColorState(next);
    try {
      if (next === "default") {
        window.localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY);
      } else {
        window.localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, next);
      }
    } catch {
      // localStorage unavailable — the choice just won't persist across reloads
    }
  }, []);

  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor }}>{children}</AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
  if (!ctx) throw new Error("useAccentColor must be used within an AccentColorProvider");
  return ctx;
}

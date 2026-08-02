"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type FontSizeMode = "small" | "medium" | "large";

export const FONT_SIZE_STORAGE_KEY = "threestone-font-size";

interface FontSizeContextValue {
  fontSize: FontSizeMode;
  setFontSize: (size: FontSizeMode) => void;
}

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

function readInitialFontSize(): FontSizeMode {
  if (typeof window === "undefined") return "medium";
  const stored = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  return stored === "small" || stored === "large" ? stored : "medium";
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeMode>(readInitialFontSize);

  const setFontSize = useCallback((next: FontSizeMode) => {
    setFontSizeState(next);
    try {
      if (next === "medium") {
        window.localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
        document.documentElement.removeAttribute("data-font-size");
      } else {
        window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, next);
        document.documentElement.setAttribute("data-font-size", next);
      }
    } catch {
      // localStorage unavailable — the choice just won't persist across reloads
    }
  }, []);

  return <FontSizeContext.Provider value={{ fontSize, setFontSize }}>{children}</FontSizeContext.Provider>;
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within a FontSizeProvider");
  return ctx;
}

export const FONT_SIZE_NO_FLASH_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  FONT_SIZE_STORAGE_KEY
)});if(v==="small"||v==="large")document.documentElement.setAttribute("data-font-size",v)}catch(e){}})();`;

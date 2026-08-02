"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export const REDUCED_MOTION_STORAGE_KEY = "threestone-reduced-motion";

interface ReducedMotionContextValue {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue | null>(null);

function readInitialReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) === "true";
}

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotionState] = useState<boolean>(readInitialReducedMotion);

  const setReducedMotion = useCallback((next: boolean) => {
    setReducedMotionState(next);
    try {
      if (next) {
        window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, "true");
        document.documentElement.setAttribute("data-reduced-motion", "true");
      } else {
        window.localStorage.removeItem(REDUCED_MOTION_STORAGE_KEY);
        document.documentElement.removeAttribute("data-reduced-motion");
      }
    } catch {
      // localStorage unavailable — the choice just won't persist across reloads
    }
  }, []);

  return (
    <ReducedMotionContext.Provider value={{ reducedMotion, setReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) throw new Error("useReducedMotion must be used within a ReducedMotionProvider");
  return ctx;
}

export const REDUCED_MOTION_NO_FLASH_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  REDUCED_MOTION_STORAGE_KEY
)})==="true")document.documentElement.setAttribute("data-reduced-motion","true")}catch(e){}})();`;

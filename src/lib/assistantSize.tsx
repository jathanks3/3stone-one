"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Same pattern as accentColor.tsx - unlike fontSize.tsx/theme.tsx, this
// only ever affects one component (the AI launcher), so it's read
// directly via the hook there rather than needing a data-attribute +
// no-flash script to control a page-wide CSS cascade.
export type AssistantSizeMode = "large" | "compact";

export const ASSISTANT_SIZE_STORAGE_KEY = "threestone-assistant-size";

interface AssistantSizeContextValue {
  assistantSize: AssistantSizeMode;
  setAssistantSize: (size: AssistantSizeMode) => void;
}

const AssistantSizeContext = createContext<AssistantSizeContextValue | null>(null);

function readInitialAssistantSize(): AssistantSizeMode {
  if (typeof window === "undefined") return "large";
  const stored = window.localStorage.getItem(ASSISTANT_SIZE_STORAGE_KEY);
  return stored === "compact" ? "compact" : "large";
}

export function AssistantSizeProvider({ children }: { children: ReactNode }) {
  const [assistantSize, setAssistantSizeState] = useState<AssistantSizeMode>(readInitialAssistantSize);

  const setAssistantSize = useCallback((next: AssistantSizeMode) => {
    setAssistantSizeState(next);
    try {
      if (next === "large") {
        window.localStorage.removeItem(ASSISTANT_SIZE_STORAGE_KEY);
      } else {
        window.localStorage.setItem(ASSISTANT_SIZE_STORAGE_KEY, next);
      }
    } catch {
      // localStorage unavailable — the choice just won't persist across reloads
    }
  }, []);

  return (
    <AssistantSizeContext.Provider value={{ assistantSize, setAssistantSize }}>
      {children}
    </AssistantSizeContext.Provider>
  );
}

export function useAssistantSize() {
  const ctx = useContext(AssistantSizeContext);
  if (!ctx) throw new Error("useAssistantSize must be used within an AssistantSizeProvider");
  return ctx;
}

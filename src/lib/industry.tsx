"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { IndustryProfile, IndustryProfileKey } from "@/types";
import { getIndustryProfile } from "@/config/industry-profiles";

interface IndustryContextValue {
  profile: IndustryProfile;
  setIndustryKey: (key: IndustryProfileKey) => void;
}

const IndustryContext = createContext<IndustryContextValue | null>(null);

export function IndustryProvider({
  initialKey,
  children,
}: {
  initialKey: IndustryProfileKey;
  children: ReactNode;
}) {
  const [key, setKey] = useState<IndustryProfileKey>(initialKey);
  const profile = useMemo(() => getIndustryProfile(key), [key]);

  const value = useMemo(() => ({ profile, setIndustryKey: setKey }), [profile]);

  return <IndustryContext.Provider value={value}>{children}</IndustryContext.Provider>;
}

export function useIndustry() {
  const ctx = useContext(IndustryContext);
  if (!ctx) throw new Error("useIndustry must be used within an IndustryProvider");
  return ctx;
}

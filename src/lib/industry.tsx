"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { IndustryProfile, IndustryProfileKey } from "@/types";
import { getIndustryProfile } from "@/config/industry-profiles";
import { getBusinessById } from "@/server/mock-data/businesses";

interface IndustryContextValue {
  profile: IndustryProfile;
  setIndustryKey: (key: IndustryProfileKey) => void;
  currentBusinessId: string;
  setBusinessId: (id: string) => void;
}

const IndustryContext = createContext<IndustryContextValue | null>(null);

export function IndustryProvider({
  initialKey,
  initialBusinessId,
  children,
}: {
  initialKey: IndustryProfileKey;
  initialBusinessId: string;
  children: ReactNode;
}) {
  const [key, setKey] = useState<IndustryProfileKey>(initialKey);
  const [currentBusinessId, setCurrentBusinessId] = useState<string>(initialBusinessId);
  const profile = useMemo(() => getIndustryProfile(key), [key]);

  function setBusinessId(id: string) {
    const business = getBusinessById(id);
    setCurrentBusinessId(id);
    setKey(business.industryProfileKey);
  }

  const value = useMemo(
    () => ({ profile, setIndustryKey: setKey, currentBusinessId, setBusinessId }),
    [profile, currentBusinessId]
  );

  return <IndustryContext.Provider value={value}>{children}</IndustryContext.Provider>;
}

export function useIndustry() {
  const ctx = useContext(IndustryContext);
  if (!ctx) throw new Error("useIndustry must be used within an IndustryProvider");
  return ctx;
}

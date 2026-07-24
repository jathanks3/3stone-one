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
  // False only for the demo session. A real session's currentBusinessId
  // is a real Workspace id, which never matches anything in
  // DEMO_BUSINESSES — components that read currentBusinessId to look up
  // mock business data (WorkspaceSwitcher, Portfolio — both still
  // entirely mock, since multi-business/Portfolio isn't converted yet)
  // must check this first, not fall back to DEMO_BUSINESSES[0] and
  // silently show one real customer another's — or the demo's — content.
  isDemo: boolean;
  // The real workspace's own name, for exactly that case — components
  // that are demo-only today (WorkspaceSwitcher's business list) show
  // this instead once real workspaces exist, without needing their own
  // database lookup.
  workspaceName: string;
}

const IndustryContext = createContext<IndustryContextValue | null>(null);

export function IndustryProvider({
  initialKey,
  initialBusinessId,
  isDemo,
  workspaceName,
  children,
}: {
  initialKey: IndustryProfileKey;
  initialBusinessId: string;
  isDemo: boolean;
  workspaceName: string;
  children: ReactNode;
}) {
  const [key, setKey] = useState<IndustryProfileKey>(initialKey);
  const [currentBusinessId, setCurrentBusinessId] = useState<string>(initialBusinessId);
  const profile = useMemo(() => getIndustryProfile(key), [key]);

  function setBusinessId(id: string) {
    // Switching between mock businesses is a demo-only feature (Portfolio
    // isn't converted yet) — a real session has exactly one workspace,
    // so there's nothing to look up or switch to.
    if (!isDemo) return;
    const business = getBusinessById(id);
    setCurrentBusinessId(id);
    setKey(business.industryProfileKey);
  }

  const value = useMemo(
    () => ({ profile, setIndustryKey: setKey, currentBusinessId, setBusinessId, isDemo, workspaceName }),
    [profile, currentBusinessId, isDemo, workspaceName]
  );

  return <IndustryContext.Provider value={value}>{children}</IndustryContext.Provider>;
}

export function useIndustry() {
  const ctx = useContext(IndustryContext);
  if (!ctx) throw new Error("useIndustry must be used within an IndustryProvider");
  return ctx;
}

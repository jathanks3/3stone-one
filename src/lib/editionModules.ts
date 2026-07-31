// src/lib/editionModules.ts
//
// Which nav module keys (src/lib/nav.ts) and integration categories
// (src/features/integrations/IntegrationsClient.tsx) an edition can see.
// Gated per edition only, not per tier within an edition - Business
// edition has zero tier-based enforcement today (Hub/Growth/Business OS
// are a billing distinction, not a feature one), so Workspace/Student
// stay consistent with that rather than inventing new rigor.
//
// `null` means unrestricted (every module) - Business edition's default.

export const EDITION_MODULES: Record<string, string[] | null> = {
  business: null,
  // Day-to-day workers, CEOs, and managers - no finance/accounting,
  // inventory, automation, or analytics.
  workspace: [
    "portfolio",
    "dashboard",
    "crm",
    "projects",
    "people",
    "communications",
    "meetings",
    "documents",
    "knowledge",
    "integrations",
    "client-portal",
    "activity",
    "settings",
  ],
  // Same philosophy as Workspace, lighter still - no CRM, people, client
  // portal, or integrations (nothing here to manage clients/a team with).
  student: ["dashboard", "projects", "meetings", "documents", "knowledge", "activity", "settings"],
};

export function getAllowedModuleKeys(editionKey: string): Set<string> | null {
  const allowed = EDITION_MODULES[editionKey];
  return allowed ? new Set(allowed) : null;
}

// Integration provider categories (see IntegrationsClient.tsx /
// mock-data/integrations.ts) an edition can see within the Integrations
// module - only relevant for editions where "integrations" is itself an
// allowed module key above. Business edition has no restriction; other
// editions default to blocking Accounting (QuickBooks and similar) but
// keep genuinely productivity-flavored tools (Excel, Google Sheets).
export const EDITION_INTEGRATION_CATEGORIES: Record<string, string[] | null> = {
  business: null,
  workspace: ["Productivity", "Communication", "Scheduling", "CRM"],
  student: null,
};

export function getAllowedIntegrationCategories(editionKey: string): Set<string> | null {
  const allowed = EDITION_INTEGRATION_CATEGORIES[editionKey];
  return allowed ? new Set(allowed) : null;
}

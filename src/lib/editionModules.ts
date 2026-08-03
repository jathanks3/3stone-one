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
  // inventory, automation, or analytics. Calendar/Notes added alongside
  // Meetings/Documents - a real add/delete calendar and a lightweight
  // notes space, not just the heavier Meetings/Documents modules.
  // time-off is Workspace-only - a real request/approve flow for
  // workers and the managers above them. Business edition already
  // covers this ground (if at all) through People + Finance's approval
  // mechanisms, and Student has no manager to approve anything.
  // portfolio (switching between every business you own) is deliberately
  // excluded - it's a multi-business-owner concept, not something a
  // day-to-day worker or the manager above them ever needs.
  workspace: [
    "dashboard",
    "crm",
    "projects",
    "people",
    "communications",
    "meetings",
    "calendar",
    "documents",
    "notes",
    "time-off",
    "knowledge",
    "integrations",
    "client-portal",
    "activity",
    "settings",
  ],
  // Same philosophy as Workspace, lighter still - no CRM, people, or
  // client portal (nothing here to manage clients/a team with). No
  // Meetings either - a student doesn't run agendas/AI summaries the way
  // a workplace does; Calendar covers classes/deadlines/study sessions
  // instead, and Notes covers quick study notes.
  // "communications" (not "emails") - same module/route Workspace uses,
  // just with its Slack and Call Notes tabs hidden (see
  // RealCommunicationsClient.tsx's isStudent gating) since neither has
  // real data to back it for Student: no CRM contacts to log a call
  // against, and Slack isn't in Student's Integrations catalog.
  // gpa (GPA Calculator) and job-tracker (Internship & Job Tracker) are
  // Student-only - not concepts that apply to any other edition,
  // including Business (which otherwise sees every module via the
  // `null` unrestricted default above).
  student: [
    "dashboard",
    "projects",
    "calendar",
    "documents",
    "notes",
    "communications",
    "grades",
    "gpa",
    "job-tracker",
    "knowledge",
    "activity",
    "settings",
    "integrations",
  ],
};

export function getAllowedModuleKeys(editionKey: string): Set<string> | null {
  const allowed = EDITION_MODULES[editionKey];
  return allowed ? new Set(allowed) : null;
}

// Integration provider categories (see IntegrationsClient.tsx /
// mock-data/integrations.ts) an edition can see within the Integrations
// module - only relevant for editions where "integrations" is itself an
// allowed module key above. Business edition has no restriction; other
// editions default to blocking Accounting/Commerce/CRM tools that don't
// fit them, keeping genuinely productivity-flavored ones (Excel, Google
// Sheets, Google Workspace/Microsoft 365, Calendly).
export const EDITION_INTEGRATION_CATEGORIES: Record<string, string[] | null> = {
  business: null,
  workspace: ["Productivity", "Communication", "Scheduling", "CRM"],
  // No CRM/Communication categories - a solo student has no customers or
  // team channels to sync, just their own calendar/documents/email.
  student: ["Productivity", "Scheduling"],
};

export function getAllowedIntegrationCategories(editionKey: string): Set<string> | null {
  const allowed = EDITION_INTEGRATION_CATEGORIES[editionKey];
  return allowed ? new Set(allowed) : null;
}

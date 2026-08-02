export type IntegrationEdition = "business" | "workspace" | "student";
export type IntegrationReadiness = "live" | "configured" | "buildable" | "approval_required";

export interface IntegrationCatalogItem {
  key: string;
  name: string;
  summary: string;
  editions: IntegrationEdition[];
  readiness: IntegrationReadiness;
  destinations: { label: string; href: string }[];
}

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  { key: "microsoft", name: "Microsoft 365", summary: "Outlook Calendar and Mail are live. OneDrive files and Teams meeting links populate Documents and Meetings after reconnecting.", editions: ["business", "workspace"], readiness: "live", destinations: [{ label: "Outlook Mail", href: "/communications" }, { label: "Calendar", href: "/calendar" }, { label: "OneDrive files", href: "/documents" }, { label: "Teams meetings", href: "/meetings" }] },
  { key: "google", name: "Google Workspace", summary: "Google Calendar is live. Gmail, Drive and Sheets require new verified scopes as each destination becomes operational.", editions: ["business", "workspace", "student"], readiness: "live", destinations: [{ label: "Calendar", href: "/calendar" }, { label: "Gmail", href: "/communications" }, { label: "Drive", href: "/documents" }, { label: "Sheets reports", href: "/analytics" }] },
  { key: "slack", name: "Slack", summary: "The Slack app is registered. Workspace installation, channel mirroring and notifications are the remaining product work.", editions: ["business", "workspace"], readiness: "configured", destinations: [{ label: "Communications", href: "/communications" }, { label: "Automations", href: "/automation" }] },
  { key: "zoom", name: "Zoom", summary: "Create and join Zoom meetings from Meetings after the free OAuth app is registered.", editions: ["business", "workspace", "student"], readiness: "buildable", destinations: [{ label: "Meetings", href: "/meetings" }, { label: "Calendar", href: "/calendar" }] },
  { key: "quickbooks", name: "QuickBooks Online", summary: "Business-only accounting sync for revenue, expenses and invoice status. Intuit developer onboarding and production approval are required.", editions: ["business"], readiness: "buildable", destinations: [{ label: "Finance", href: "/finance" }, { label: "Analytics", href: "/analytics" }] },
  { key: "paychex", name: "Paychex Flex", summary: "Business payroll and workforce sync. Paychex must approve 3Stone One before issuing sandbox and production credentials.", editions: ["business"], readiness: "approval_required", destinations: [{ label: "People", href: "/people" }, { label: "Finance", href: "/finance" }, { label: "Time off", href: "/time-off" }] },
  { key: "canvas", name: "Canvas", summary: "Student connection using the school's Canvas URL and the student's personal access token; no central OAuth app is required.", editions: ["business", "student"], readiness: "buildable", destinations: [{ label: "Calendar", href: "/calendar" }, { label: "Projects", href: "/projects" }, { label: "Documents", href: "/documents" }] },
  { key: "linkedin", name: "LinkedIn Jobs", summary: "Track saved job links and confirmation or recruiter email; LinkedIn does not expose a personal application-history API.", editions: ["business", "student"], readiness: "buildable", destinations: [{ label: "Internship & Job Tracker", href: "/job-tracker" }] },
  { key: "handshake", name: "Handshake", summary: "Track internship links and email. Official application API access is institution-scoped and requires Handshake approval.", editions: ["business", "student"], readiness: "approval_required", destinations: [{ label: "Internship & Job Tracker", href: "/job-tracker" }, { label: "Calendar", href: "/calendar" }] },
];

export function integrationsForEdition(editionKey: string): IntegrationCatalogItem[] {
  const edition = (editionKey === "workspace" || editionKey === "student" ? editionKey : "business") as IntegrationEdition;
  return INTEGRATION_CATALOG.filter((item) => item.editions.includes(edition));
}

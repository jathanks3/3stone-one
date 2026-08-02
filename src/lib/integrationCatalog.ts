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
  { key: "microsoft", name: "Microsoft 365", summary: "Workplace and Business connect Outlook Mail, Calendar, OneDrive and Teams to their real destinations.", editions: ["business", "workspace"], readiness: "live", destinations: [{ label: "Outlook Mail", href: "/communications" }, { label: "Calendar", href: "/calendar" }, { label: "OneDrive files", href: "/documents" }, { label: "Teams meetings", href: "/meetings" }] },
  { key: "microsoft", name: "Microsoft OneDrive", summary: "Student connection requests OneDrive file access only; it does not request Outlook Mail, Calendar or Teams.", editions: ["student"], readiness: "live", destinations: [{ label: "OneDrive files", href: "/documents" }] },
  { key: "google", name: "Google Workspace", summary: "Business connects Gmail, Calendar, Drive and Sheets reporting to their real destinations.", editions: ["business"], readiness: "live", destinations: [{ label: "Calendar", href: "/calendar" }, { label: "Gmail", href: "/communications" }, { label: "Drive", href: "/documents" }, { label: "Sheets reports", href: "/analytics" }] },
  { key: "google", name: "Google Gmail & Calendar", summary: "Workplace requests Gmail and Google Calendar access without Drive or Sheets permissions.", editions: ["workspace"], readiness: "live", destinations: [{ label: "Calendar", href: "/calendar" }, { label: "Gmail", href: "/communications" }] },
  { key: "google", name: "Google Drive", summary: "Student connection requests Google Drive read access only; it does not request Gmail, Calendar or Sheets.", editions: ["student"], readiness: "live", destinations: [{ label: "Google Drive files", href: "/documents" }] },
  { key: "slack", name: "Slack", summary: "The Slack app is registered. Workspace installation, channel mirroring and notifications are the remaining product work.", editions: ["business", "workspace"], readiness: "configured", destinations: [{ label: "Communications", href: "/communications" }, { label: "Automations", href: "/automation" }] },
  { key: "zoom", name: "Zoom", summary: "Optional meeting-link pathway is available; automatic OAuth creation is deferred until a clear product use case requires it.", editions: ["business", "workspace"], readiness: "buildable", destinations: [{ label: "Meetings", href: "/meetings" }] },
  { key: "quickbooks", name: "QuickBooks Online", summary: "Business-only accounting sync for revenue, expenses and invoice status. Intuit developer onboarding and production approval are required.", editions: ["business"], readiness: "buildable", destinations: [{ label: "Finance", href: "/finance" }, { label: "Analytics", href: "/analytics" }] },
  { key: "paychex", name: "Paychex Flex", summary: "Business payroll and workforce sync. Paychex must approve 3Stone One before issuing sandbox and production credentials.", editions: ["business"], readiness: "approval_required", destinations: [{ label: "People", href: "/people" }, { label: "Finance", href: "/finance" }, { label: "Time off", href: "/time-off" }] },
  { key: "canvas", name: "Canvas", summary: "Student connection using the school's Canvas URL and the student's personal access token; upcoming assignments populate Calendar.", editions: ["student"], readiness: "live", destinations: [{ label: "Calendar", href: "/calendar" }, { label: "Projects", href: "/projects" }, { label: "Documents", href: "/documents" }] },
  { key: "linkedin", name: "LinkedIn Jobs", summary: "Track saved job links and confirmation or recruiter email; LinkedIn does not expose a personal application-history API.", editions: ["business", "student"], readiness: "buildable", destinations: [{ label: "Internship & Job Tracker", href: "/job-tracker" }] },
  { key: "handshake", name: "Handshake", summary: "Track internship links and email. Official application API access is institution-scoped and requires Handshake approval.", editions: ["business", "student"], readiness: "approval_required", destinations: [{ label: "Internship & Job Tracker", href: "/job-tracker" }, { label: "Calendar", href: "/calendar" }] },
  { key: "12twenty", name: "12twenty Law Careers", summary: "Law-school job applications, interviews, events and outcomes require an institution-issued API key; students can track 12twenty listing links immediately.", editions: ["student"], readiness: "approval_required", destinations: [{ label: "Internship & Job Tracker", href: "/job-tracker" }, { label: "Calendar", href: "/calendar" }] },
];

export function integrationsForEdition(editionKey: string): IntegrationCatalogItem[] {
  const edition = (editionKey === "workspace" || editionKey === "student" ? editionKey : "business") as IntegrationEdition;
  return INTEGRATION_CATALOG.filter((item) => item.editions.includes(edition));
}

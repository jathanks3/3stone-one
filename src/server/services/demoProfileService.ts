import { db } from "@/server/db";

export interface DemoProfileRow {
  id: string;
  label: string;
  editionKey: string;
  orgName: string;
  industryProfileKey: string;
  accentColor: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  industryLabel: string | null;
  createdAt: Date;
  enabledModuleKeys?: string[] | null;
  aiEnabled?: boolean;
}

const FEATURE_MODULES: Record<string, string> = {
  "Executive Overview": "portfolio",
  "Command Dashboard": "dashboard",
  Dashboard: "dashboard",
  CRM: "crm",
  Projects: "projects",
  Assignments: "projects",
  People: "people",
  Communications: "communications",
  "Team Communication": "communications",
  Meetings: "meetings",
  Calendar: "calendar",
  Documents: "documents",
  Notes: "notes",
  "Time Off": "time-off",
  "Knowledge Center": "knowledge",
  Finance: "finance",
  Inventory: "inventory",
  Automation: "automation",
  Analytics: "analytics",
  "Analytics & Reports": "analytics",
  Integrations: "integrations",
  Grades: "grades",
  "GPA Calculator": "gpa",
  "Internship & Job Tracker": "job-tracker",
  "Activity Log": "activity",
};

function industryProfileFor(industry: string, edition: string) {
  if (edition === "student") return "student";
  if (industry === "nonprofit") return "nonprofit";
  if (edition === "workspace") return "workplace";
  const businessProfiles: Record<string, string> = {
    healthcare: "medical",
    retail: "clothing_brand",
    creative: "event_center",
    education: "nonprofit",
    technology: "workplace",
    "professional-services": "law_firm",
  };
  return businessProfiles[industry] ?? "construction";
}

async function getExternalDemoProfile(slug: string): Promise<DemoProfileRow | null> {
  const platformUrl = process.env.ADMIN_PLATFORM_URL ?? (process.env.NODE_ENV === "production" ? "https://admin.3stoneai.com" : "http://localhost:3000");
  try {
    const response = await fetch(`${platformUrl}/api/v1/public/custom-demos/${encodeURIComponent(slug)}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json() as { organizationName?: string; edition?: string; industry?: string; industryLabel?: string; accentColor?: string; secondaryColor?: string; logoUrl?: string | null; enabledFeatures?: string[] };
    if (!data.organizationName || !data.edition || !data.industry) return null;
    const selected = Array.isArray(data.enabledFeatures) ? data.enabledFeatures : [];
    const enabledModuleKeys = Array.from(new Set(["dashboard", "settings", ...selected.map((feature) => FEATURE_MODULES[feature]).filter((key): key is string => Boolean(key))]));
    return {
      id: `external:${slug}`,
      label: data.organizationName,
      editionKey: data.edition,
      orgName: data.organizationName,
      industryProfileKey: industryProfileFor(data.industry, data.edition),
      accentColor: data.accentColor ?? null,
      secondaryColor: data.secondaryColor ?? null,
      logoUrl: data.logoUrl ?? null,
      industryLabel: data.industryLabel ?? data.industry,
      createdAt: new Date(),
      enabledModuleKeys,
      aiEnabled: selected.includes("AI Assistant"),
    };
  } catch {
    return null;
  }
}

export async function listDemoProfiles(): Promise<DemoProfileRow[]> {
  return db.demoProfile.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getDemoProfile(id: string): Promise<DemoProfileRow | null> {
  if (id.startsWith("external:")) return getExternalDemoProfile(id.slice("external:".length));
  return db.demoProfile.findUnique({ where: { id } });
}

export interface CreateDemoProfileInput {
  label: string;
  editionKey: "workspace" | "student";
  orgName: string;
  industryProfileKey: string;
  accentColor?: string | null;
  industryLabel?: string | null;
}

export async function createDemoProfile(input: CreateDemoProfileInput): Promise<DemoProfileRow> {
  const label = input.label.trim();
  const orgName = input.orgName.trim();
  if (!label) throw new Error("Label is required.");
  if (!orgName) throw new Error("Organization name is required.");
  return db.demoProfile.create({
    data: {
      label,
      editionKey: input.editionKey,
      orgName,
      industryProfileKey: input.industryProfileKey,
      accentColor: input.accentColor || null,
      industryLabel: input.industryLabel?.trim() || null,
    },
  });
}

export async function deleteDemoProfile(id: string): Promise<void> {
  await db.demoProfile.delete({ where: { id } });
}

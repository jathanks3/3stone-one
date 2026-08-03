import { db } from "@/server/db";

export interface DemoProfileRow {
  id: string;
  label: string;
  editionKey: string;
  orgName: string;
  industryProfileKey: string;
  accentColor: string | null;
  industryLabel: string | null;
  createdAt: Date;
}

export async function listDemoProfiles(): Promise<DemoProfileRow[]> {
  return db.demoProfile.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getDemoProfile(id: string): Promise<DemoProfileRow | null> {
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

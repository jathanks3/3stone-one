import { db } from "@/server/db";
import type { IndustryProfileKey } from "@/types";

export interface WorkspaceSettings {
  name: string;
  slug: string;
  timezone: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  industryProfileKey: IndustryProfileKey | null;
}

export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  const workspace = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  return {
    name: workspace.name,
    slug: workspace.slug,
    timezone: workspace.timezone,
    address: workspace.address,
    contactEmail: workspace.contactEmail,
    contactPhone: workspace.contactPhone,
    logoUrl: workspace.logoUrl,
    industryProfileKey: workspace.industryProfileKey as IndustryProfileKey | null,
  };
}

export interface WorkspaceSettingsInput {
  name: string;
  slug: string;
  timezone?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  industryProfileKey?: IndustryProfileKey;
}

export async function updateWorkspaceSettings(workspaceId: string, input: WorkspaceSettingsInput): Promise<void> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!name) throw new Error("Workspace name is required.");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Slug can only contain lowercase letters, numbers, and hyphens.");
  }

  const existingSlug = await db.workspace.findUnique({ where: { slug } });
  if (existingSlug && existingSlug.id !== workspaceId) {
    throw new Error(`"${slug}" is already taken.`);
  }

  await db.workspace.update({
    where: { id: workspaceId },
    data: {
      name,
      slug,
      timezone: input.timezone || null,
      address: input.address || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
      ...(input.industryProfileKey ? { industryProfileKey: input.industryProfileKey } : {}),
    },
  });
}

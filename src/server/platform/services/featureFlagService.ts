import { db } from "@/server/db";

export interface FeatureFlagListItem {
  key: string;
  label: string;
  description: string | null;
  defaultEnabled: boolean;
  createdAt: Date;
}

// Global product feature flags the founder can toggle from the Platform
// section. Per-workspace overrides (WorkspaceFeatureOverride) exist in the
// schema for a later milestone; this first pass is global on/off only —
// the smallest real control loop a feature check can consult.
export async function listFeatureFlags(): Promise<FeatureFlagListItem[]> {
  const flags = await db.featureFlag.findMany({ orderBy: { createdAt: "desc" } });
  return flags.map((f) => ({
    key: f.key,
    label: f.label,
    description: f.description,
    defaultEnabled: f.defaultEnabled,
    createdAt: f.createdAt,
  }));
}

export async function createFeatureFlag(input: {
  key: string;
  label: string;
  description?: string;
}): Promise<void> {
  await db.featureFlag.create({
    data: {
      key: input.key,
      label: input.label,
      description: input.description || null,
      defaultEnabled: false,
    },
  });
}

export async function setFeatureFlagEnabled(key: string, enabled: boolean): Promise<void> {
  await db.featureFlag.update({ where: { key }, data: { defaultEnabled: enabled } });
}

// Read path every feature check should call — never invent a default for
// a key that was never created, since an unknown flag is a bug to surface,
// not silently treat as off.
export async function isFeatureEnabled(key: string): Promise<boolean | null> {
  const flag = await db.featureFlag.findUnique({ where: { key }, select: { defaultEnabled: true } });
  return flag ? flag.defaultEnabled : null;
}

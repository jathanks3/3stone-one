"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import { createFeatureFlag, setFeatureFlagEnabled } from "@/server/platform/services/featureFlagService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export interface AddFeatureFlagFormState {
  error?: string;
}

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export async function addFeatureFlagAction(
  _prevState: AddFeatureFlagFormState,
  formData: FormData
): Promise<AddFeatureFlagFormState> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }

  const key = String(formData.get("key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!key || !label) {
    return { error: "Key and label are required." };
  }
  if (!KEY_PATTERN.test(key)) {
    return { error: "Key must be lowercase letters, numbers, and underscores, starting with a letter." };
  }

  try {
    await createFeatureFlag({ key, label, description: description || undefined });
  } catch {
    return { error: `A flag with key "${key}" already exists.` };
  }
  await recordAuditEntry({
    staffUserId: session.userId,
    action: "created_feature_flag",
    targetEntityType: "FeatureFlag",
    targetEntityId: key,
  });
  revalidatePath("/3stone-ai/feature-flags");
  return {};
}

export async function toggleFeatureFlagAction(key: string, enabled: boolean): Promise<void> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    throw new Error("Not authorized.");
  }

  await setFeatureFlagEnabled(key, enabled);
  await recordAuditEntry({
    staffUserId: session.userId,
    action: enabled ? "enabled_feature_flag" : "disabled_feature_flag",
    targetEntityType: "FeatureFlag",
    targetEntityId: key,
  });
  revalidatePath("/3stone-ai/feature-flags");
}

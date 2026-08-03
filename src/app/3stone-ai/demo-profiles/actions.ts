"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import { createDemoProfile, deleteDemoProfile } from "@/server/services/demoProfileService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export interface AddDemoProfileFormState {
  error?: string;
}

const EDITION_KEYS = new Set(["workspace", "student"]);
const INDUSTRY_KEYS = new Set(["workplace", "nonprofit", "student"]);

export async function addDemoProfileAction(
  _prevState: AddDemoProfileFormState,
  formData: FormData
): Promise<AddDemoProfileFormState> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }

  const label = String(formData.get("label") ?? "").trim();
  const editionKey = String(formData.get("editionKey") ?? "");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const industryProfileKey = String(formData.get("industryProfileKey") ?? "");
  const accentColor = String(formData.get("accentColor") ?? "");
  const industryLabel = String(formData.get("industryLabel") ?? "").trim();

  if (!label || !orgName) return { error: "Name and organization are required." };
  if (!EDITION_KEYS.has(editionKey)) return { error: "Choose an edition." };
  if (!INDUSTRY_KEYS.has(industryProfileKey)) return { error: "Choose a valid industry wording." };

  await createDemoProfile({
    label,
    editionKey: editionKey as "workspace" | "student",
    orgName,
    industryProfileKey,
    accentColor: accentColor || null,
    industryLabel: industryLabel || null,
  });
  await recordAuditEntry({ staffUserId: session.userId, action: "created_demo_profile", targetEntityType: "DemoProfile" });
  revalidatePath("/3stone-ai/demo-profiles");
  return {};
}

export async function deleteDemoProfileAction(id: string): Promise<void> {
  const session = await getSession();
  if (!hasStaffAccess(session)) throw new Error("Not authorized.");

  await deleteDemoProfile(id);
  await recordAuditEntry({ staffUserId: session.userId, action: "deleted_demo_profile", targetEntityType: "DemoProfile", targetEntityId: id });
  revalidatePath("/3stone-ai/demo-profiles");
}

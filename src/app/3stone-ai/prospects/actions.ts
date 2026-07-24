"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import { createProspect } from "@/server/platform/services/salesPipelineService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export interface AddProspectFormState {
  error?: string;
}

export async function addProspectAction(_prevState: AddProspectFormState, formData: FormData): Promise<AddProspectFormState> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  await createProspect({ name, email, businessName: businessName || undefined });
  await recordAuditEntry({ staffUserId: session.userId, action: "created_sales_prospect" });
  revalidatePath("/3stone-ai/prospects");
  return {};
}

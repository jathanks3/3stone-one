"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, selectIndustry, confirmProductAndEdition } from "@/server/services/onboardingService";
import type { IndustryProfileKey } from "@/types";

export interface IndustryFormState {
  error?: string;
}

export async function selectIndustryAction(_prevState: IndustryFormState, formData: FormData): Promise<IndustryFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }

  const industryProfileKey = String(formData.get("industryProfileKey") ?? "") as IndustryProfileKey;
  if (!industryProfileKey) {
    return { error: "Choose an industry." };
  }

  await selectIndustry(workspaceId, industryProfileKey);
  // Product and Edition have exactly one real option today
  // (3stone_one/business) — no picker UI, see onboardingService.ts.
  await confirmProductAndEdition(workspaceId);
  redirect("/signup/plan");
}

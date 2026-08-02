"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, setBusinessInfo } from "@/server/services/onboardingService";

export interface BusinessInfoFormState {
  error?: string;
}

export async function setBusinessInfoAction(
  _prevState: BusinessInfoFormState,
  formData: FormData
): Promise<BusinessInfoFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }

  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) {
    return { error: "Enter your business name." };
  }

  await setBusinessInfo(workspaceId, businessName);
  redirect("/signup/industry");
}

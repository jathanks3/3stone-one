"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, acceptTerms, completeSetup } from "@/server/services/onboardingService";

export interface TermsFormState {
  error?: string;
}

export async function acceptTermsAction(_prevState: TermsFormState, formData: FormData): Promise<TermsFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }
  if (formData.get("accepted") !== "on") {
    return { error: "You need to accept the Terms of Service to continue." };
  }

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await acceptTerms(workspaceId, session.userId, ipAddress);
  await completeSetup(workspaceId);
  redirect("/dashboard");
}

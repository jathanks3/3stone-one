"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, selectPlan } from "@/server/services/onboardingService";

export interface PlanFormState {
  error?: string;
}

export async function selectPlanAction(_prevState: PlanFormState, _formData: FormData): Promise<PlanFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }

  // Free is the only real, immediately-available plan — there's no
  // Stripe integration yet, so Pro/Enterprise aren't offered as a
  // working choice here (see the page itself). Enabling paid Stripe
  // products is an explicit approval boundary in its own right, not
  // something to route around with a plan selector that can't actually
  // charge anyone.
  await selectPlan(workspaceId, "free");
  redirect("/signup/terms");
}

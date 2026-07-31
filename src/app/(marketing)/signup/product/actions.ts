"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, confirmProductAndEdition, selectIndustry } from "@/server/services/onboardingService";

export interface ProductFormState {
  error?: string;
}

const VALID_EDITIONS = new Set(["business", "workspace", "student"]);

export async function selectEditionAction(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }

  const editionKey = String(formData.get("editionKey") ?? "");
  if (!VALID_EDITIONS.has(editionKey)) {
    return { error: "Choose an option." };
  }

  await confirmProductAndEdition(workspaceId, editionKey);

  // "Which industry are you in" only makes sense for the flagship product
  // - Workspace and Student each have exactly one fixed profile (see
  // src/config/industry-profiles/workplace.ts, student.ts), so there's
  // nothing to ask; skip straight to plan selection instead of showing a
  // construction/restaurant/etc picker that doesn't apply to them.
  if (editionKey === "business") {
    redirect("/signup/industry");
  }
  await selectIndustry(workspaceId, editionKey === "workspace" ? "workplace" : "student");
  redirect("/signup/plan");
}

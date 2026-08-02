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

  // "What's your business name" and "which industry are you in" only
  // make sense for the flagship product - Workspace is a day-to-day
  // worker/manager's own workspace (not necessarily "a business"), and
  // Student definitely isn't one. Workspace/Student each get a fixed
  // industry profile (see src/config/industry-profiles/workplace.ts,
  // student.ts) and skip both steps straight to plan selection, rather
  // than being asked for a business name they don't have.
  if (editionKey === "business") {
    redirect("/signup/business-info");
  }
  await selectIndustry(workspaceId, editionKey === "workspace" ? "workplace" : "student");
  redirect("/signup/plan");
}

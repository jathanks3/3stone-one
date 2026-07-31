"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, confirmProductAndEdition } from "@/server/services/onboardingService";

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
  redirect("/signup/plan");
}

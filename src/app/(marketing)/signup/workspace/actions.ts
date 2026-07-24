"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createWorkspace } from "@/server/services/onboardingService";

export interface WorkspaceFormState {
  error?: string;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createWorkspaceAction(_prevState: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }

  const slug = slugify(String(formData.get("slug") ?? ""));
  if (!slug) {
    return { error: "Enter a workspace name." };
  }

  try {
    await createWorkspace(session.userId, slug);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  redirect("/signup/business-info");
}

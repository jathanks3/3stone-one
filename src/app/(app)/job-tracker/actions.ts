"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createJobApplication, deleteJobApplication, moveJobApplication } from "@/server/services/jobApplicationService";

export interface ActionState {
  error?: string;
  success?: string;
  id?: string;
}

async function currentWorkspaceId(): Promise<{ userId: string; workspaceId: string }> {
  const session = await getSession();
  if (!session || session.isDemo) throw new Error("Not authenticated.");
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) throw new Error("No workspace.");
  return { userId: session.userId, workspaceId };
}

export async function createJobApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const application = await createJobApplication(
      workspaceId,
      userId,
      String(formData.get("company") ?? ""),
      String(formData.get("role") ?? ""),
      String(formData.get("notes") ?? "")
    );
    revalidatePath("/job-tracker");
    return { success: "Application added.", id: application.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function moveJobApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const direction = Number(formData.get("direction") ?? 0) as -1 | 1;
    await moveJobApplication(workspaceId, userId, String(formData.get("applicationId") ?? ""), direction);
    revalidatePath("/job-tracker");
    return { success: "Application moved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteJobApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteJobApplication(workspaceId, userId, String(formData.get("applicationId") ?? ""));
    revalidatePath("/job-tracker");
    return { success: "Application deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

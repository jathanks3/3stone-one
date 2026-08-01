"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createTimeOffRequest, decideTimeOffRequest, deleteTimeOffRequest } from "@/server/services/timeOffService";
import type { TimeOffType } from "../../../../generated/prisma/client";

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

export async function createTimeOffRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const request = await createTimeOffRequest(
      workspaceId,
      userId,
      String(formData.get("type") ?? "vacation") as TimeOffType,
      String(formData.get("startDate") ?? ""),
      String(formData.get("endDate") ?? ""),
      String(formData.get("notes") ?? "")
    );
    revalidatePath("/time-off");
    return { success: "Request submitted.", id: request.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function decideTimeOffRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    const decision = String(formData.get("decision") ?? "") as "approved" | "denied";
    await decideTimeOffRequest(workspaceId, userId, String(formData.get("requestId") ?? ""), decision);
    revalidatePath("/time-off");
    return { success: decision === "approved" ? "Request approved." : "Request denied." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteTimeOffRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await deleteTimeOffRequest(workspaceId, userId, String(formData.get("requestId") ?? ""));
    revalidatePath("/time-off");
    return { success: "Request deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

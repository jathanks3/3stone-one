"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import {
  addActionItem,
  addDecision,
  createMeeting,
  deleteMeeting,
  toggleActionItem,
  type CreateMeetingInput,
} from "@/server/services/meetingService";

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

export async function createMeetingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const input: CreateMeetingInput = {
      title: String(formData.get("title") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      attendees: String(formData.get("attendees") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      agenda: String(formData.get("agenda") ?? ""),
    };
    const meeting = await createMeeting(workspaceId, userId, input);
    revalidatePath("/meetings");
    return { success: "Meeting scheduled.", id: meeting.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteMeetingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteMeeting(workspaceId, String(formData.get("meetingId") ?? ""), userId);
    revalidatePath("/meetings");
    return { success: "Meeting deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function addActionItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const item = await addActionItem(workspaceId, String(formData.get("meetingId") ?? ""), userId, String(formData.get("title") ?? ""));
    revalidatePath("/meetings");
    return { success: "Action item added.", id: item.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function toggleActionItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await toggleActionItem(workspaceId, String(formData.get("meetingId") ?? ""), String(formData.get("actionItemId") ?? ""), userId);
    revalidatePath("/meetings");
    return { success: "Updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function addDecisionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const decision = await addDecision(workspaceId, String(formData.get("meetingId") ?? ""), userId, String(formData.get("summary") ?? ""));
    revalidatePath("/meetings");
    return { success: "Decision recorded.", id: decision.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

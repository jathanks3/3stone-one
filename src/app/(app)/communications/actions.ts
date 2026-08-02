"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createCallNote, createChannel, sendMessage } from "@/server/services/communicationsService";
import { sendOutlookMail } from "@/server/services/microsoftIntegrationService";
import { sendSlackMessage } from "@/server/services/slackIntegrationService";

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

export async function createChannelAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const channel = await createChannel(workspaceId, userId, String(formData.get("name") ?? ""));
    revalidatePath("/communications");
    return { success: "Channel created.", id: channel.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const message = await sendMessage(workspaceId, String(formData.get("channelId") ?? ""), userId, String(formData.get("body") ?? ""));
    revalidatePath("/communications");
    return { success: "Sent.", id: message.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createCallNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const note = await createCallNote(workspaceId, userId, String(formData.get("personId") ?? ""), String(formData.get("summary") ?? ""));
    revalidatePath("/communications");
    return { success: "Call note logged.", id: note.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function sendOutlookMailAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await sendOutlookMail(workspaceId, {
      to: String(formData.get("to") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
    });
    revalidatePath("/communications");
    return { success: "Email sent." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function sendSlackMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await sendSlackMessage(workspaceId, String(formData.get("channelId") ?? ""), String(formData.get("body") ?? ""));
    revalidatePath("/communications");
    return { success: "Slack message sent." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

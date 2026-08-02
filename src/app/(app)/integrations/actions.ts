"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireTeamManager } from "@/server/services/teamService";
import { disconnectGoogle } from "@/server/services/googleIntegrationService";
import { disconnectMicrosoft } from "@/server/services/microsoftIntegrationService";
import { disconnectSlack } from "@/server/services/slackIntegrationService";

export interface ActionState {
  error?: string;
  success?: string;
}

async function currentWorkspaceId(): Promise<{ userId: string; workspaceId: string }> {
  const session = await getSession();
  if (!session || session.isDemo) throw new Error("Not authenticated.");
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) throw new Error("No workspace.");
  return { userId: session.userId, workspaceId };
}

export async function disconnectGoogleAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await disconnectGoogle(workspaceId);
    revalidatePath("/integrations");
    return { success: "Google disconnected." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function disconnectMicrosoftAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await disconnectMicrosoft(workspaceId);
    revalidatePath("/integrations");
    return { success: "Microsoft disconnected." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function disconnectSlackAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await disconnectSlack(workspaceId);
    revalidatePath("/integrations");
    return { success: "Slack disconnected." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

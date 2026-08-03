"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireTeamManager } from "@/server/services/teamService";
import { disconnectGoogle } from "@/server/services/googleIntegrationService";
import { disconnectMicrosoft } from "@/server/services/microsoftIntegrationService";
import { disconnectSlack } from "@/server/services/slackIntegrationService";
import { connectCanvas, disconnectCanvas } from "@/server/services/canvasIntegrationService";
import { connectWildApricot, disconnectWildApricot } from "@/server/services/wildApricotIntegrationService";
import { disconnectBasecamp } from "@/server/services/basecampIntegrationService";

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

export async function connectCanvasAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await connectCanvas(workspaceId, userId, String(formData.get("baseUrl") ?? ""), String(formData.get("accessToken") ?? ""));
    revalidatePath("/integrations");
    revalidatePath("/calendar");
    return { success: "Canvas connected. Upcoming assignments now populate Calendar." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't connect Canvas." };
  }
}

export async function disconnectCanvasAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await disconnectCanvas(workspaceId);
    revalidatePath("/integrations");
    revalidatePath("/calendar");
    return { success: "Canvas disconnected." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't disconnect Canvas." };
  }
}

export async function connectWildApricotAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await connectWildApricot(workspaceId, userId, String(formData.get("apiKey") ?? ""));
    revalidatePath("/integrations");
    revalidatePath("/crm");
    return { success: "Wild Apricot connected. Members now populate CRM." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't connect Wild Apricot." };
  }
}

export async function disconnectWildApricotAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await disconnectWildApricot(workspaceId);
    revalidatePath("/integrations");
    revalidatePath("/crm");
    return { success: "Wild Apricot disconnected." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't disconnect Wild Apricot." };
  }
}

export async function disconnectBasecampAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    await disconnectBasecamp(workspaceId);
    revalidatePath("/integrations");
    revalidatePath("/projects");
    return { success: "Basecamp disconnected." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't disconnect Basecamp." };
  }
}

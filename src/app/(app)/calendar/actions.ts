"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createCalendarEvent, deleteCalendarEvent } from "@/server/services/calendarService";

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

export async function createCalendarEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const event = await createCalendarEvent(
      workspaceId,
      userId,
      String(formData.get("title") ?? ""),
      String(formData.get("date") ?? ""),
      String(formData.get("time") ?? "")
    );
    revalidatePath("/calendar");
    return { success: "Event added.", id: event.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteCalendarEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteCalendarEvent(workspaceId, String(formData.get("eventId") ?? ""), userId);
    revalidatePath("/calendar");
    return { success: "Event deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

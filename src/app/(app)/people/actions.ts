"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember, requireTeamManager } from "@/server/services/teamService";
import {
  assignMemberDepartment,
  createAnnouncement,
  createDepartment,
  deleteAnnouncement,
} from "@/server/services/peopleService";

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

export async function createDepartmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    const department = await createDepartment(workspaceId, userId, String(formData.get("name") ?? ""));
    revalidatePath("/people");
    return { success: "Department added.", id: department.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function assignMemberDepartmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireTeamManager(userId, workspaceId);
    const departmentId = String(formData.get("departmentId") ?? "") || null;
    await assignMemberDepartment(workspaceId, String(formData.get("memberId") ?? ""), userId, departmentId);
    revalidatePath("/people");
    return { success: "Updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const announcement = await createAnnouncement(
      workspaceId,
      userId,
      String(formData.get("title") ?? ""),
      String(formData.get("body") ?? ""),
      String(formData.get("departmentId") ?? "") || undefined
    );
    revalidatePath("/people");
    return { success: "Announcement posted.", id: announcement.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteAnnouncement(workspaceId, String(formData.get("announcementId") ?? ""), userId);
    revalidatePath("/people");
    return { success: "Announcement deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

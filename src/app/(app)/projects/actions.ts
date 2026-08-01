"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import {
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  toggleTaskDone,
  updateProjectStatus,
  type ProjectStatusKey,
} from "@/server/services/projectService";

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

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const project = await createProject(workspaceId, userId, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
    });
    revalidatePath("/projects");
    return { success: "Project created.", id: project.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function updateProjectStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await updateProjectStatus(workspaceId, String(formData.get("projectId") ?? ""), userId, String(formData.get("statusKey") ?? "") as ProjectStatusKey);
    revalidatePath("/projects");
    return { success: "Status updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteProject(workspaceId, String(formData.get("projectId") ?? ""), userId);
    revalidatePath("/projects");
    return { success: "Project deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const task = await createTask(workspaceId, String(formData.get("projectId") ?? ""), userId, String(formData.get("title") ?? ""));
    revalidatePath("/projects");
    return { success: "Task added.", id: task.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function toggleTaskDoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await toggleTaskDone(workspaceId, String(formData.get("taskId") ?? ""), userId);
    revalidatePath("/projects");
    return { success: "Task updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteTask(workspaceId, String(formData.get("taskId") ?? ""), userId);
    revalidatePath("/projects");
    return { success: "Task deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

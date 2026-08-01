"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createGpaCourse, deleteGpaCourse, updateGpaCourse, type DisplayLetterGrade } from "@/server/services/gpaService";

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

export async function createGpaCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const course = await createGpaCourse(
      workspaceId,
      userId,
      String(formData.get("name") ?? ""),
      Number(formData.get("credits") ?? 0),
      String(formData.get("grade") ?? "A") as DisplayLetterGrade
    );
    revalidatePath("/gpa");
    return { success: "Course added.", id: course.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function updateGpaCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await updateGpaCourse(workspaceId, userId, String(formData.get("courseId") ?? ""), {
      name: formData.has("name") ? String(formData.get("name")) : undefined,
      credits: formData.has("credits") ? Number(formData.get("credits")) : undefined,
      grade: formData.has("grade") ? (String(formData.get("grade")) as DisplayLetterGrade) : undefined,
    });
    revalidatePath("/gpa");
    return { success: "Course updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteGpaCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteGpaCourse(workspaceId, userId, String(formData.get("courseId") ?? ""));
    revalidatePath("/gpa");
    return { success: "Course removed." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

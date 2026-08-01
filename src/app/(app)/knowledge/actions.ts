"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import {
  createKnowledgeArticle,
  deleteKnowledgeArticle,
  updateKnowledgeArticle,
  type KnowledgeArticleInput,
} from "@/server/services/knowledgeService";
import type { KnowledgeCategory } from "../../../../generated/prisma/client";

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

function inputFromForm(formData: FormData): KnowledgeArticleInput {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    category: String(formData.get("category") ?? "process") as KnowledgeCategory,
    videoUrl: String(formData.get("videoUrl") ?? "") || undefined,
  };
}

export async function createKnowledgeArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const article = await createKnowledgeArticle(workspaceId, userId, inputFromForm(formData));
    revalidatePath("/knowledge");
    return { success: "Article added.", id: article.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function updateKnowledgeArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await updateKnowledgeArticle(workspaceId, String(formData.get("articleId") ?? ""), userId, inputFromForm(formData));
    revalidatePath("/knowledge");
    return { success: "Article saved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteKnowledgeArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteKnowledgeArticle(workspaceId, String(formData.get("articleId") ?? ""), userId);
    revalidatePath("/knowledge");
    return { success: "Article deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createDocument, deleteDocument, setDocumentVisibility, type CreateDocumentInput } from "@/server/services/documentService";
import type { DocumentVisibility } from "../../../../generated/prisma/client";

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

export async function createDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const input: CreateDocumentInput = {
      name: String(formData.get("name") ?? ""),
      uploadedFileId: String(formData.get("uploadedFileId") ?? ""),
      mimeType: String(formData.get("mimeType") ?? "application/octet-stream"),
      sizeBytes: Number(formData.get("sizeBytes") ?? 0),
      visibility: (String(formData.get("visibility") ?? "internal") as DocumentVisibility),
    };
    await createDocument(workspaceId, userId, input);
    revalidatePath("/documents");
    return { success: "Document added." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function setDocumentVisibilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const documentId = String(formData.get("documentId") ?? "");
    const visibility = String(formData.get("visibility") ?? "internal") as DocumentVisibility;
    await setDocumentVisibility(workspaceId, documentId, userId, visibility);
    revalidatePath("/documents");
    return { success: "Visibility updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteDocumentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const documentId = String(formData.get("documentId") ?? "");
    await deleteDocument(workspaceId, documentId, userId);
    revalidatePath("/documents");
    return { success: "Document deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

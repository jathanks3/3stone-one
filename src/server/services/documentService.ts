import { db } from "@/server/db";
import { deleteUpload } from "@/server/services/storageService";
import { logActivity } from "@/server/services/activityService";
import type { DocumentVisibility } from "../../../generated/prisma/client";

export interface DocumentRow {
  id: string;
  uploadedFileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string | null;
  uploadedByName: string | null;
  visibility: DocumentVisibility;
  createdAt: Date;
}

export async function listDocuments(workspaceId: string): Promise<DocumentRow[]> {
  const docs = await db.document.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const uploaderIds = [...new Set(docs.map((d) => d.uploadedById).filter((id): id is string => !!id))];
  const uploaders = uploaderIds.length
    ? await db.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(uploaders.map((u) => [u.id, u.name]));
  return docs.map((d) => ({
    id: d.id,
    uploadedFileId: d.storageKey,
    name: d.name,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    uploadedById: d.uploadedById,
    uploadedByName: d.uploadedById ? nameById.get(d.uploadedById) ?? "Former member" : null,
    visibility: d.visibility,
    createdAt: d.createdAt,
  }));
}

export interface CreateDocumentInput {
  name: string;
  uploadedFileId: string;
  mimeType: string;
  sizeBytes: number;
  visibility: DocumentVisibility;
}

// uploadedFileId (the UploadedFile row created by /api/uploads/confirm)
// is stored in Document.storageKey — the field storageService's
// download route already expects, so no changes were needed there to
// make secure download work for this module.
export async function createDocument(workspaceId: string, uploadedById: string, input: CreateDocumentInput): Promise<DocumentRow> {
  const name = input.name.trim();
  if (!name) throw new Error("Document name is required.");
  const file = await db.uploadedFile.findFirst({ where: { id: input.uploadedFileId, workspaceId, kind: "document" } });
  if (!file) throw new Error("Upload not found.");

  const doc = await db.document.create({
    data: {
      workspaceId,
      name,
      storageKey: input.uploadedFileId,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedById,
      visibility: input.visibility,
    },
  });
  await logActivity(workspaceId, uploadedById, "uploaded_document", "Document", doc.id, { name });
  return { ...doc, uploadedFileId: doc.storageKey, uploadedByName: null };
}

export async function setDocumentVisibility(workspaceId: string, documentId: string, actorId: string, visibility: DocumentVisibility): Promise<void> {
  const doc = await db.document.findFirst({ where: { id: documentId, workspaceId } });
  if (!doc) throw new Error("Document not found.");
  await db.document.update({ where: { id: documentId }, data: { visibility } });
  await logActivity(workspaceId, actorId, "updated_document_visibility", "Document", documentId, { visibility });
}

export async function deleteDocument(workspaceId: string, documentId: string, actorId: string): Promise<void> {
  const doc = await db.document.findFirst({ where: { id: documentId, workspaceId } });
  if (!doc) throw new Error("Document not found.");
  await db.document.delete({ where: { id: documentId } });
  // Best-effort: the storage object and its UploadedFile row are cleaned
  // up too, but a missing/already-gone file must never block deleting
  // the business record itself.
  try {
    await deleteUpload(doc.storageKey, workspaceId, actorId);
  } catch {
    // already removed, or storage isn't configured — the Document row
    // deletion above is the source of truth for this module either way.
  }
  await logActivity(workspaceId, actorId, "deleted_document", "Document", documentId, { name: doc.name });
}

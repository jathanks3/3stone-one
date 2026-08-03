import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import { uploadBufferAndRecord } from "@/server/services/storageService";
import { createDocument } from "@/server/services/documentService";
import {
  getRecentGmailMessages,
  getGmailMessageDetail,
  getGmailAttachmentBytes,
  type GmailMessage,
} from "@/server/services/googleIntegrationService";
import {
  getRecentOutlookMessages,
  getOutlookMessageDetail,
  getOutlookAttachmentBytes,
  type OutlookMessage,
} from "@/server/services/microsoftIntegrationService";

// Emails module: read-through only, same rule as Documents' Canvas/Drive
// merge and Calendar's Google/Outlook merge - nothing here is ever copied
// into our own storage except the one explicit action a user takes
// (saveAttachmentToDocuments below), never an automatic background sync.

export type InboxProvider = "google" | "microsoft";

export interface InboxMessageRow {
  id: string;
  provider: InboxProvider;
  subject: string;
  from: string;
  receivedAt: string;
  preview: string;
}

export interface ConnectedInboxProviders {
  google: boolean;
  microsoft: boolean;
}

export async function getConnectedInboxProviders(workspaceId: string): Promise<ConnectedInboxProviders> {
  const [google, microsoft] = await Promise.all([
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
  ]);
  return { google: google?.status === "connected", microsoft: microsoft?.status === "connected" };
}

function fromGmail(m: GmailMessage): InboxMessageRow {
  return { id: m.id, provider: "google", subject: m.subject, from: m.from, receivedAt: m.receivedAt, preview: m.preview };
}

function fromOutlook(m: OutlookMessage): InboxMessageRow {
  return { id: m.id, provider: "microsoft", subject: m.subject, from: m.senderName, receivedAt: m.receivedAt, preview: m.preview };
}

/** Merged, most-recent-first inbox across whichever provider(s) are
 * connected. Returns [] rather than throwing when nothing is connected -
 * this feeds a page/AI context, not an action a user is blocked on. */
export async function listInboxMessages(workspaceId: string, limit = 25): Promise<InboxMessageRow[]> {
  const connected = await getConnectedInboxProviders(workspaceId);
  const [gmail, outlook] = await Promise.all([
    connected.google ? getRecentGmailMessages(workspaceId, limit).catch(() => []) : Promise.resolve([]),
    connected.microsoft ? getRecentOutlookMessages(workspaceId, limit).catch(() => []) : Promise.resolve([]),
  ]);
  return [...gmail.map(fromGmail), ...outlook.map(fromOutlook)]
    .sort((a, b) => (b.receivedAt || "").localeCompare(a.receivedAt || ""))
    .slice(0, limit);
}

export interface InboxAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  // "link" (Outlook referenceAttachment only - a share link with no bytes
  // to fetch) renders as "Open link" in the UI instead of Preview/Save.
  kind: "file" | "link";
  url: string | null;
}

export interface InboxMessageDetail {
  id: string;
  provider: InboxProvider;
  subject: string;
  from: string;
  receivedAt: string;
  bodyText: string;
  attachments: InboxAttachment[];
}

export async function getInboxMessageDetail(workspaceId: string, provider: InboxProvider, messageId: string): Promise<InboxMessageDetail> {
  if (provider === "google") {
    const detail = await getGmailMessageDetail(workspaceId, messageId);
    return {
      id: detail.id,
      provider,
      subject: detail.subject,
      from: detail.from,
      receivedAt: detail.receivedAt,
      bodyText: detail.bodyText,
      attachments: detail.attachments.map((a) => ({ id: a.attachmentId, filename: a.filename, mimeType: a.mimeType, sizeBytes: a.sizeBytes, kind: "file" as const, url: null })),
    };
  }
  const detail = await getOutlookMessageDetail(workspaceId, messageId);
  return {
    id: detail.id,
    provider,
    subject: detail.subject,
    from: detail.senderName,
    receivedAt: detail.receivedAt,
    bodyText: detail.bodyText,
    attachments: detail.attachments.map((a) => ({ id: a.id, filename: a.name, mimeType: a.contentType, sizeBytes: a.sizeBytes, kind: a.kind, url: a.url })),
  };
}

/** Downloads one attachment straight from Gmail/Outlook and lands it in
 * Documents, real bytes and all - the one point where this module's
 * "read-through only" rule intentionally has an exception, because the
 * user explicitly asked for a copy to keep. */
export async function saveInboxAttachmentToDocuments(
  workspaceId: string,
  actorId: string,
  provider: InboxProvider,
  messageId: string,
  attachmentId: string,
  filename: string,
  mimeType: string
): Promise<{ documentId: string }> {
  const buffer = provider === "google"
    ? await getGmailAttachmentBytes(workspaceId, messageId, attachmentId)
    : await getOutlookAttachmentBytes(workspaceId, messageId, attachmentId);

  const uploaded = await uploadBufferAndRecord({
    workspaceId,
    uploadedByUserId: actorId,
    kind: "document",
    filename,
    buffer,
    mimeType,
  });
  const doc = await createDocument(workspaceId, actorId, {
    name: filename,
    uploadedFileId: uploaded.id,
    mimeType,
    sizeBytes: buffer.byteLength,
    visibility: "internal",
  });
  await logActivity(workspaceId, actorId, "saved_email_attachment", "Document", doc.id, { filename, provider });
  return { documentId: doc.id };
}

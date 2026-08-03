"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { getInboxMessageDetail, saveInboxAttachmentToDocuments, type InboxProvider } from "@/server/services/inboxService";
import { sendGmail } from "@/server/services/googleIntegrationService";
import { sendOutlookMail } from "@/server/services/microsoftIntegrationService";

export interface ActionState {
  error?: string;
  success?: string;
}

export interface MessageDetailState extends ActionState {
  detail?: Awaited<ReturnType<typeof getInboxMessageDetail>>;
}

async function currentWorkspaceId(): Promise<{ userId: string; workspaceId: string }> {
  const session = await getSession();
  if (!session || session.isDemo) throw new Error("Not authenticated.");
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) throw new Error("No workspace.");
  return { userId: session.userId, workspaceId };
}

export async function loadMessageDetailAction(_prev: MessageDetailState, formData: FormData): Promise<MessageDetailState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const provider = String(formData.get("provider") ?? "") as InboxProvider;
    const messageId = String(formData.get("messageId") ?? "");
    if (!messageId) return { error: "No message selected." };
    const detail = await getInboxMessageDetail(workspaceId, provider, messageId);
    return { success: "Loaded.", detail };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't load that email." };
  }
}

// Reply from the message thread pane (RealEmailsClient) - same
// Gmail/Outlook send functions Communications' Compose already uses
// (see (app)/communications/actions.ts), just reachable from the Emails
// module's own reply box instead of a separate compose form.
export async function sendReplyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const provider = String(formData.get("provider") ?? "") as InboxProvider;
    const to = String(formData.get("to") ?? "");
    const subject = String(formData.get("subject") ?? "");
    const body = String(formData.get("body") ?? "");
    if (!to || !body) return { error: "Nothing to send." };
    if (provider === "google") {
      await sendGmail(workspaceId, { to, subject, body });
    } else {
      await sendOutlookMail(workspaceId, { to, subject, body });
    }
    return { success: "Reply sent." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't send that reply." };
  }
}

export async function saveAttachmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const provider = String(formData.get("provider") ?? "") as InboxProvider;
    const messageId = String(formData.get("messageId") ?? "");
    const attachmentId = String(formData.get("attachmentId") ?? "");
    const filename = String(formData.get("filename") ?? "attachment");
    const mimeType = String(formData.get("mimeType") ?? "application/octet-stream");
    if (!messageId || !attachmentId) return { error: "Attachment not found." };
    await saveInboxAttachmentToDocuments(workspaceId, userId, provider, messageId, attachmentId, filename, mimeType);
    revalidatePath("/documents");
    return { success: `Saved "${filename}" to Documents.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save that attachment." };
  }
}

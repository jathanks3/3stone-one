"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import {
  createAnnouncement,
  deleteAnnouncement,
  setAnnouncementPublished,
} from "@/server/platform/services/announcementService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export interface AddAnnouncementFormState {
  error?: string;
}

export async function addAnnouncementAction(
  _prevState: AddAnnouncementFormState,
  formData: FormData
): Promise<AddAnnouncementFormState> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    return { error: "Not authorized." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) {
    return { error: "Title and body are required." };
  }

  await createAnnouncement({ title, body });
  await recordAuditEntry({ staffUserId: session.userId, action: "created_announcement" });
  revalidatePath("/3stone-ai/announcements");
  return {};
}

export async function togglePublishAction(id: string, published: boolean): Promise<void> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    throw new Error("Not authorized.");
  }

  await setAnnouncementPublished(id, published);
  await recordAuditEntry({
    staffUserId: session.userId,
    action: published ? "published_announcement" : "unpublished_announcement",
    targetEntityType: "PlatformAnnouncement",
    targetEntityId: id,
  });
  revalidatePath("/3stone-ai/announcements");
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    throw new Error("Not authorized.");
  }

  await deleteAnnouncement(id);
  await recordAuditEntry({
    staffUserId: session.userId,
    action: "deleted_announcement",
    targetEntityType: "PlatformAnnouncement",
    targetEntityId: id,
  });
  revalidatePath("/3stone-ai/announcements");
}

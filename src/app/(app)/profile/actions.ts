"use server";

import { headers } from "next/headers";
import { getSession, createSession } from "@/lib/session";
import { updateProfile, updateNotificationPreferences } from "@/server/services/profileService";
import { changePassword } from "@/server/services/authService";
import type { NotificationCategory } from "@/server/services/notificationService";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.isDemo) return { error: "Not authenticated." };
  try {
    await updateProfile(session.userId, {
      name: String(formData.get("name") ?? ""),
      avatarUrl: String(formData.get("avatarUrl") ?? ""),
    });
    return { success: "Profile updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.isDemo) return { error: "Not authenticated." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (newPassword !== confirm) return { error: "New passwords don't match." };

  try {
    const headerList = await headers();
    const { sessionVersion } = await changePassword(session.userId, currentPassword, newPassword, {
      ipAddress: headerList.get("x-forwarded-for"),
      userAgent: headerList.get("user-agent"),
    });
    // Re-create the current browser's own session with the new
    // sessionVersion so the acting user isn't logged out of their own
    // action — every OTHER session (a different browser/device) still
    // carries the old version and will fail the check on its next request.
    await createSession({ ...session, sessionVersion });
    return { success: "Password changed. You're still signed in here; other sessions have been signed out." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function updatePreferencesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.isDemo) return { error: "Not authenticated." };
  const preferences: Record<NotificationCategory, boolean> = {
    workspace: formData.get("workspace") === "on",
    security: formData.get("security") === "on",
  };
  await updateNotificationPreferences(session.userId, preferences);
  return { success: "Notification preferences saved." };
}

import { db } from "@/server/db";
import type { NotificationCategory } from "@/server/services/notificationService";

export interface Profile {
  name: string;
  email: string;
  avatarUrl: string | null;
  notificationPreferences: Record<NotificationCategory, boolean>;
}

const DEFAULT_PREFERENCES: Record<NotificationCategory, boolean> = { workspace: true, security: true };

export async function getProfile(userId: string): Promise<Profile> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const stored = (user.notificationPreferences ?? null) as Partial<Record<NotificationCategory, boolean>> | null;
  return {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    notificationPreferences: { ...DEFAULT_PREFERENCES, ...(stored ?? {}) },
  };
}

export async function updateProfile(userId: string, input: { name: string; avatarUrl?: string }): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required.");
  await db.user.update({
    where: { id: userId },
    // avatarUrl is only touched when the caller explicitly passed it
    // (the plain-URL fallback form) — undefined means "leave it alone",
    // not "clear it". See profile/actions.ts's comment for why that
    // distinction matters once uploads exist.
    data: { name, ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}) },
  });
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Record<NotificationCategory, boolean>
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { notificationPreferences: preferences },
  });
}

import { db } from "@/server/db";
import type { Prisma } from "../../../generated/prisma/client";
import type { NotificationItem } from "@/types";

// One real notification type -> {title, body} mapping, kept in this file
// since it's the only place that needs to know both the type strings
// used when creating a notification and how to render one. Notification
// itself stores no title/body columns (schema.prisma: "free string type,
// Json payload") — deliberately data-driven so a new notification type
// doesn't need a migration, just a case here.
function describe(type: string, payload: Prisma.JsonValue): { title: string; body: string } {
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  switch (type) {
    case "invitation_accepted":
      return { title: `${p.memberName ?? "Someone"} joined the workspace`, body: `Joined as ${p.roleName ?? "a member"}.` };
    case "role_changed":
      return { title: "Your role was updated", body: `You're now ${p.roleName ?? "a member"} of ${p.workspaceName ?? "this workspace"}.` };
    case "password_changed":
      return {
        title: "Your password was changed",
        body: p.via === "reset" ? "Changed via a password reset link." : "Changed from your account settings.",
      };
    case "onboarding_complete":
      return { title: "Setup complete", body: `${p.workspaceName ?? "Your workspace"} is ready to use.` };
    case "payment_failed":
      return { title: "A payment failed", body: "Update your payment method in Settings → Billing to avoid interruption." };
    default:
      return { title: type, body: "" };
  }
}

function formatTimestamp(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export type NotificationCategory = "workspace" | "security";
const TYPE_CATEGORY: Record<string, NotificationCategory> = {
  invitation_accepted: "workspace",
  role_changed: "workspace",
  onboarding_complete: "workspace",
  password_changed: "security",
  payment_failed: "security",
};

// Preferences are real and enforced here, not just decorative toggles in
// a settings form: a category a user has turned off means the row is
// never created, not created-but-hidden. `null`/missing means "on" — the
// honest default, since nobody has opted out of anything until they do.
export async function createNotification(
  workspaceId: string,
  userId: string,
  type: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const category = TYPE_CATEGORY[type];
  if (category) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { notificationPreferences: true } });
    const prefs = (user?.notificationPreferences ?? null) as Record<string, boolean> | null;
    if (prefs && prefs[category] === false) return;
  }
  await db.notification.create({
    data: { workspaceId, userId, type, payload: payload as Prisma.InputJsonValue },
  });
}

export async function listNotifications(workspaceId: string, userId: string, limit = 20): Promise<NotificationItem[]> {
  const rows = await db.notification.findMany({
    where: { workspaceId, userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((n) => {
    const { title, body } = describe(n.type, n.payload);
    return { id: n.id, title, body, timestamp: formatTimestamp(n.createdAt), read: n.readAt !== null };
  });
}

export async function markAllRead(workspaceId: string, userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { workspaceId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

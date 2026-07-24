import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listNotifications } from "@/server/services/notificationService";

// Real sessions only — demo sessions render their own local mock array
// client-side (NotificationsMenu) and never reach this route at all.
export async function GET() {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return NextResponse.json({ notifications: [] });
  }
  const notifications = await listNotifications(workspaceId, session.userId);
  return NextResponse.json({ notifications });
}

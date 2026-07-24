import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { markAllRead } from "@/server/services/notificationService";

export async function POST() {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (workspaceId) {
    await markAllRead(workspaceId, session.userId);
  }
  return NextResponse.json({ ok: true });
}

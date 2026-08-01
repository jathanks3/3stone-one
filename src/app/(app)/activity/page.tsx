import type { Metadata } from "next";
import { ActivityClient } from "@/features/activity/ActivityClient";
import { RealActivityClient } from "@/features/activity/RealActivityClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listActivity } from "@/server/services/activityService";

export const metadata: Metadata = { title: "Activity Log — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const activity = workspaceId ? await listActivity(workspaceId) : [];
    return <RealActivityClient initialActivity={activity} />;
  }
  return <ActivityClient />;
}

import type { Metadata } from "next";
import { TimeOffClient } from "@/features/time-off/TimeOffClient";
import { RealTimeOffClient } from "@/features/time-off/RealTimeOffClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listTimeOffRequests } from "@/server/services/timeOffService";

export const metadata: Metadata = { title: "Time Off — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function TimeOffPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const requests = workspaceId ? await listTimeOffRequests(workspaceId) : [];
    return <RealTimeOffClient initialRequests={requests} />;
  }
  return <TimeOffClient />;
}

import type { Metadata } from "next";
import { MeetingsClient } from "@/features/meetings/MeetingsClient";
import { RealMeetingsClient } from "@/features/meetings/RealMeetingsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listMeetings, listMicrosoftMeetings } from "@/server/services/meetingService";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Meetings — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const meetings = workspaceId ? await listMeetings(workspaceId) : [];
    const microsoft = workspaceId ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }) : null;
    const syncedMeetings = workspaceId && microsoft?.status === "connected" ? await listMicrosoftMeetings(workspaceId).catch(() => []) : [];
    return <RealMeetingsClient initialMeetings={[...meetings, ...syncedMeetings]} />;
  }
  return <MeetingsClient />;
}

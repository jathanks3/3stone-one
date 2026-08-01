import type { Metadata } from "next";
import { MeetingsClient } from "@/features/meetings/MeetingsClient";
import { RealMeetingsClient } from "@/features/meetings/RealMeetingsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listMeetings } from "@/server/services/meetingService";

export const metadata: Metadata = { title: "Meetings — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const meetings = workspaceId ? await listMeetings(workspaceId) : [];
    return <RealMeetingsClient initialMeetings={meetings} />;
  }
  return <MeetingsClient />;
}

import type { Metadata } from "next";
import { CommunicationsClient } from "@/features/communications/CommunicationsClient";
import { RealCommunicationsClient } from "@/features/communications/RealCommunicationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listCallNotes, listChannels, listMessages } from "@/server/services/communicationsService";
import { listPeople } from "@/server/services/crmService";

export const metadata: Metadata = { title: "Communications — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) return <RealCommunicationsClient initialChannels={[]} initialMessages={[]} initialCallNotes={[]} people={[]} />;
    const channels = await listChannels(workspaceId);
    const messagesByChannel = await Promise.all(channels.map((c) => listMessages(workspaceId, c.id)));
    const [callNotes, people] = await Promise.all([listCallNotes(workspaceId), listPeople(workspaceId)]);
    return (
      <RealCommunicationsClient
        initialChannels={channels}
        initialMessages={messagesByChannel.flat()}
        initialCallNotes={callNotes}
        people={people}
      />
    );
  }
  return <CommunicationsClient />;
}

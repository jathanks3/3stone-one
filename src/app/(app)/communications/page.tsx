import type { Metadata } from "next";
import { CommunicationsClient } from "@/features/communications/CommunicationsClient";
import { RealCommunicationsClient } from "@/features/communications/RealCommunicationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listCallNotes, listChannels, listMessages } from "@/server/services/communicationsService";
import { listPeople } from "@/server/services/crmService";
import { getRecentOutlookMessages } from "@/server/services/microsoftIntegrationService";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Communications — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) return <RealCommunicationsClient initialChannels={[]} initialMessages={[]} initialCallNotes={[]} people={[]} outlookConnected={false} outlookMessages={[]} />;
    const channels = await listChannels(workspaceId);
    const messagesByChannel = await Promise.all(channels.map((c) => listMessages(workspaceId, c.id)));
    const microsoft = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } });
    const outlookConnected = microsoft?.status === "connected";
    const [callNotes, people, outlookMessages] = await Promise.all([
      listCallNotes(workspaceId),
      listPeople(workspaceId),
      outlookConnected ? getRecentOutlookMessages(workspaceId).catch(() => null) : Promise.resolve([]),
    ]);
    return (
      <RealCommunicationsClient
        initialChannels={channels}
        initialMessages={messagesByChannel.flat()}
        initialCallNotes={callNotes}
        people={people}
        outlookConnected={outlookConnected}
        outlookMessages={outlookMessages}
      />
    );
  }
  return <CommunicationsClient />;
}

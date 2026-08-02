import type { Metadata } from "next";
import { CommunicationsClient } from "@/features/communications/CommunicationsClient";
import { RealCommunicationsClient } from "@/features/communications/RealCommunicationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listCallNotes, listChannels, listMessages } from "@/server/services/communicationsService";
import { listPeople } from "@/server/services/crmService";
import { getRecentOutlookMessages } from "@/server/services/microsoftIntegrationService";
import { getRecentGmailMessages } from "@/server/services/googleIntegrationService";
import { db } from "@/server/db";
import { listSlackChannels, listSlackMessages } from "@/server/services/slackIntegrationService";

export const metadata: Metadata = { title: "Communications — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) return <RealCommunicationsClient initialChannels={[]} initialMessages={[]} initialCallNotes={[]} people={[]} outlookConnected={false} outlookMessages={[]} gmailConnected={false} gmailMessages={[]} slackConnected={false} slackChannels={[]} slackMessages={[]} />;
    const channels = await listChannels(workspaceId);
    const messagesByChannel = await Promise.all(channels.map((c) => listMessages(workspaceId, c.id)));
    const microsoft = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } });
    const google = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } });
    const slack = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "slack" } } });
    const outlookConnected = microsoft?.status === "connected";
    const gmailConnected = google?.status === "connected";
    const slackConnected = slack?.status === "connected";
    const [callNotes, people, outlookMessages, gmailMessages, slackChannels] = await Promise.all([
      listCallNotes(workspaceId),
      listPeople(workspaceId),
      outlookConnected ? getRecentOutlookMessages(workspaceId).catch(() => null) : Promise.resolve([]),
      gmailConnected ? getRecentGmailMessages(workspaceId).catch(() => null) : Promise.resolve([]),
      slackConnected ? listSlackChannels(workspaceId).catch(() => null) : Promise.resolve([]),
    ]);
    const slackMessages = slackChannels ? (await Promise.all(slackChannels.slice(0, 20).map((channel) => listSlackMessages(workspaceId, channel.id).catch(() => [])))).flat() : null;
    return (
      <RealCommunicationsClient
        initialChannels={channels}
        initialMessages={messagesByChannel.flat()}
        initialCallNotes={callNotes}
        people={people}
        outlookConnected={outlookConnected}
        outlookMessages={outlookMessages}
        gmailConnected={gmailConnected}
        gmailMessages={gmailMessages}
        slackConnected={slackConnected}
        slackChannels={slackChannels}
        slackMessages={slackMessages}
      />
    );
  }
  return <CommunicationsClient />;
}

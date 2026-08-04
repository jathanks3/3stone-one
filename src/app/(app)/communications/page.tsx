import type { Metadata } from "next";
import { CommunicationsClient } from "@/features/communications/CommunicationsClient";
import { RealCommunicationsClient } from "@/features/communications/RealCommunicationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listCallNotes } from "@/server/services/communicationsService";
import { listPeople } from "@/server/services/crmService";
import { getRecentOutlookMessages } from "@/server/services/microsoftIntegrationService";
import { db } from "@/server/db";
import { listSlackChannels, listSlackMessages } from "@/server/services/slackIntegrationService";

export const metadata: Metadata = { title: "Communications — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) return <RealCommunicationsClient editionKey="business" initialCallNotes={[]} people={[]} outlookConnected={false} outlookMessages={[]} slackConnected={false} slackChannels={[]} slackMessages={[]} />;
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { editionKey: true } });
    const editionKey = workspace?.editionKey ?? "business";
    // Student has neither CRM (Call Notes needs a contact to log against)
    // nor Slack in its Integrations catalog (integrationCatalog.ts) - skip
    // those queries entirely rather than run them for data the client
    // won't render (see RealCommunicationsClient's isStudent gating).
    const isStudent = editionKey === "student";
    const microsoft = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } });
    const slack = isStudent ? null : await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "slack" } } });
    const outlookConnected = microsoft?.status === "connected";
    const slackConnected = slack?.status === "connected";
    const [callNotes, people, outlookMessages, slackChannels] = await Promise.all([
      isStudent ? Promise.resolve([]) : listCallNotes(workspaceId),
      isStudent ? Promise.resolve([]) : listPeople(workspaceId),
      outlookConnected ? getRecentOutlookMessages(workspaceId).catch(() => null) : Promise.resolve([]),
      slackConnected ? listSlackChannels(workspaceId).catch(() => null) : Promise.resolve([]),
    ]);
    const slackMessages = slackChannels ? (await Promise.all(slackChannels.slice(0, 20).map((channel) => listSlackMessages(workspaceId, channel.id).catch(() => [])))).flat() : null;
    return (
      <RealCommunicationsClient
        editionKey={editionKey}
        initialCallNotes={callNotes}
        people={people}
        outlookConnected={outlookConnected}
        outlookMessages={outlookMessages}
        slackConnected={slackConnected}
        slackChannels={slackChannels}
        slackMessages={slackMessages}
      />
    );
  }
  return <CommunicationsClient />;
}

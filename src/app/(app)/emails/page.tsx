import type { Metadata } from "next";
import { EmailsClient } from "@/features/emails/EmailsClient";
import { RealEmailsClient } from "@/features/emails/RealEmailsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { getRecentGmailMessages } from "@/server/services/googleIntegrationService";
import { getRecentOutlookMessages } from "@/server/services/microsoftIntegrationService";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Emails — 3Stone One" };
export const dynamic = "force-dynamic";

// Same per-provider-tab shape as Workspace's Communications page (see
// (app)/communications/page.tsx) - Gmail and Outlook are fetched and
// shown separately rather than merged into one list, so this reads as
// the same product pattern rather than a bespoke one-off for Student.
export default async function EmailsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) {
      return <RealEmailsClient gmailConnected={false} gmailMessages={[]} outlookConnected={false} outlookMessages={[]} />;
    }
    const [google, microsoft] = await Promise.all([
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
    ]);
    const gmailConnected = google?.status === "connected";
    const outlookConnected = microsoft?.status === "connected";
    const [gmailMessages, outlookMessages] = await Promise.all([
      gmailConnected ? getRecentGmailMessages(workspaceId).catch(() => null) : Promise.resolve([]),
      outlookConnected ? getRecentOutlookMessages(workspaceId).catch(() => null) : Promise.resolve([]),
    ]);
    return (
      <RealEmailsClient
        gmailConnected={gmailConnected}
        gmailMessages={gmailMessages}
        outlookConnected={outlookConnected}
        outlookMessages={outlookMessages}
      />
    );
  }
  return <EmailsClient />;
}

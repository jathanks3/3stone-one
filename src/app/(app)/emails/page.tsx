import type { Metadata } from "next";
import { EmailsClient } from "@/features/emails/EmailsClient";
import { RealEmailsClient } from "@/features/emails/RealEmailsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { getRecentOutlookMessages } from "@/server/services/microsoftIntegrationService";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Emails — 3Stone One" };
export const dynamic = "force-dynamic";

// Same per-provider-tab shape as Workspace's Communications page (see
// (app)/communications/page.tsx). Microsoft is the inbox provider for
// every edition; Google remains available to Business for explicit sends.
export default async function EmailsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) {
      return <RealEmailsClient outlookConnected={false} outlookMessages={[]} />;
    }
    const microsoft = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } });
    const outlookConnected = microsoft?.status === "connected";
    const outlookMessages = outlookConnected ? await getRecentOutlookMessages(workspaceId).catch(() => null) : [];
    return (
      <RealEmailsClient
        outlookConnected={outlookConnected}
        outlookMessages={outlookMessages}
      />
    );
  }
  return <EmailsClient />;
}

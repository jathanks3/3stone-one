import type { Metadata } from "next";
import { EmailsClient } from "@/features/emails/EmailsClient";
import { RealEmailsClient } from "@/features/emails/RealEmailsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listInboxMessages, getConnectedInboxProviders } from "@/server/services/inboxService";

export const metadata: Metadata = { title: "Emails — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const [messages, providers] = workspaceId
      ? await Promise.all([listInboxMessages(workspaceId).catch(() => []), getConnectedInboxProviders(workspaceId)])
      : [[], { google: false, microsoft: false }];
    return <RealEmailsClient initialMessages={messages} connected={providers} />;
  }
  return <EmailsClient />;
}

import type { Metadata } from "next";
import { IntegrationsClient } from "@/features/integrations/IntegrationsClient";
import { RealIntegrationsClient } from "@/features/integrations/RealIntegrationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { db } from "@/server/db";
import { isGoogleIntegrationConfigured, getUpcomingGoogleCalendarEvents } from "@/server/services/googleIntegrationService";

export const metadata: Metadata = { title: "Integrations — 3Stone One" };

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    return <IntegrationsClient />;
  }

  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return <IntegrationsClient />;
  }

  const google = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } });
  const events = google?.status === "connected" ? await getUpcomingGoogleCalendarEvents(workspaceId).catch(() => null) : null;

  return (
    <RealIntegrationsClient
      googleConfigured={isGoogleIntegrationConfigured()}
      googleStatus={google?.status ?? "not_connected"}
      googleConnectedAt={google?.connectedAt?.toISOString() ?? null}
      googleEvents={events}
    />
  );
}

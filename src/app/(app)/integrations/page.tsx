import type { Metadata } from "next";
import { IntegrationsClient } from "@/features/integrations/IntegrationsClient";
import { RealIntegrationsClient } from "@/features/integrations/RealIntegrationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { db } from "@/server/db";
import { isGoogleIntegrationConfigured, getUpcomingGoogleCalendarEvents } from "@/server/services/googleIntegrationService";
import { isMicrosoftIntegrationConfigured, getUpcomingOutlookEvents } from "@/server/services/microsoftIntegrationService";

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

  const [google, microsoft] = await Promise.all([
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
  ]);
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { editionKey: true } });
  const [googleEvents, microsoftEvents] = await Promise.all([
    google?.status === "connected" ? getUpcomingGoogleCalendarEvents(workspaceId).catch(() => null) : Promise.resolve(null),
    microsoft?.status === "connected" ? getUpcomingOutlookEvents(workspaceId).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <RealIntegrationsClient
      googleConfigured={isGoogleIntegrationConfigured()}
      googleStatus={google?.status ?? "not_connected"}
      googleConnectedAt={google?.connectedAt?.toISOString() ?? null}
      googleEvents={googleEvents}
      microsoftConfigured={isMicrosoftIntegrationConfigured()}
      microsoftStatus={microsoft?.status ?? "not_connected"}
      microsoftConnectedAt={microsoft?.connectedAt?.toISOString() ?? null}
      microsoftEvents={microsoftEvents}
      editionKey={workspace?.editionKey ?? "business"}
    />
  );
}

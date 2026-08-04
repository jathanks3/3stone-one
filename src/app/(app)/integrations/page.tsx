import type { Metadata } from "next";
import { IntegrationsClient } from "@/features/integrations/IntegrationsClient";
import { RealIntegrationsClient } from "@/features/integrations/RealIntegrationsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { db } from "@/server/db";
import { isGoogleIntegrationConfigured, getUpcomingGoogleCalendarEvents } from "@/server/services/googleIntegrationService";
import { isMicrosoftIntegrationConfigured, getUpcomingOutlookEvents } from "@/server/services/microsoftIntegrationService";
import { isSlackIntegrationConfigured, listSlackChannels } from "@/server/services/slackIntegrationService";
import { isBasecampIntegrationConfigured, listBasecampProjects } from "@/server/services/basecampIntegrationService";
import { listCanvasAssignments } from "@/server/services/canvasIntegrationService";
import { listWildApricotContacts } from "@/server/services/wildApricotIntegrationService";
import { isMondayIntegrationConfigured, listMondayBoards } from "@/server/services/mondayIntegrationService";
import { isSalesforceIntegrationConfigured, listSalesforceAccounts } from "@/server/services/salesforceIntegrationService";

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

  const [google, microsoft, slack, canvas, wildApricot, basecamp, monday, salesforce, openai, anthropic] = await Promise.all([
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "slack" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "wildapricot" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "basecamp" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "monday" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "salesforce" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "ai_openai" } } }),
    db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "ai_anthropic" } } }),
  ]);
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { editionKey: true } });
  const [googleEvents, microsoftEvents, slackProbe, canvasProbe, wildApricotProbe, basecampProbe, mondayProbe, salesforceProbe] = await Promise.all([
    google?.status === "connected" ? getUpcomingGoogleCalendarEvents(workspaceId).catch(() => null) : Promise.resolve(null),
    microsoft?.status === "connected" ? getUpcomingOutlookEvents(workspaceId).catch(() => null) : Promise.resolve(null),
    slack?.status === "connected" ? listSlackChannels(workspaceId).then(() => true).catch(() => false) : Promise.resolve(null),
    canvas?.status === "connected" ? listCanvasAssignments(workspaceId).then(() => true).catch(() => false) : Promise.resolve(null),
    wildApricot?.status === "connected" ? listWildApricotContacts(workspaceId).then(() => true).catch(() => false) : Promise.resolve(null),
    basecamp?.status === "connected" ? listBasecampProjects(workspaceId).then(() => true).catch(() => false) : Promise.resolve(null),
    monday?.status === "connected" ? listMondayBoards(workspaceId).then(() => true).catch(() => false) : Promise.resolve(null),
    salesforce?.status === "connected" ? listSalesforceAccounts(workspaceId).then(() => true).catch(() => false) : Promise.resolve(null),
  ]);

  return (
    <RealIntegrationsClient
      googleConfigured={isGoogleIntegrationConfigured()}
      googleStatus={google?.status === "connected" && googleEvents === null ? "error" : google?.status ?? "not_connected"}
      googleConnectedAt={google?.connectedAt?.toISOString() ?? null}
      googleEvents={googleEvents}
      microsoftConfigured={isMicrosoftIntegrationConfigured()}
      microsoftStatus={microsoft?.status === "connected" && microsoftEvents === null ? "error" : microsoft?.status ?? "not_connected"}
      microsoftConnectedAt={microsoft?.connectedAt?.toISOString() ?? null}
      microsoftEvents={microsoftEvents}
      editionKey={workspace?.editionKey ?? "business"}
      slackConfigured={isSlackIntegrationConfigured()}
      slackStatus={slack?.status === "connected" && slackProbe === false ? "error" : slack?.status ?? "not_connected"}
      slackConnectedAt={slack?.connectedAt?.toISOString() ?? null}
      canvasStatus={canvas?.status === "connected" && canvasProbe === false ? "error" : canvas?.status ?? "not_connected"}
      canvasConnectedAt={canvas?.connectedAt?.toISOString() ?? null}
      wildApricotStatus={wildApricot?.status === "connected" && wildApricotProbe === false ? "error" : wildApricot?.status ?? "not_connected"}
      wildApricotConnectedAt={wildApricot?.connectedAt?.toISOString() ?? null}
      basecampConfigured={isBasecampIntegrationConfigured()}
      basecampStatus={basecamp?.status === "connected" && basecampProbe === false ? "error" : basecamp?.status ?? "not_connected"}
      basecampConnectedAt={basecamp?.connectedAt?.toISOString() ?? null}
      mondayConfigured={isMondayIntegrationConfigured()}
      mondayStatus={monday?.status === "connected" && mondayProbe === false ? "error" : monday?.status ?? "not_connected"}
      mondayConnectedAt={monday?.connectedAt?.toISOString() ?? null}
      salesforceConfigured={isSalesforceIntegrationConfigured()}
      salesforceStatus={salesforce?.status === "connected" && salesforceProbe === false ? "error" : salesforce?.status ?? "not_connected"}
      salesforceConnectedAt={salesforce?.connectedAt?.toISOString() ?? null}
      openaiStatus={openai?.status ?? "not_connected"}
      openaiConnectedAt={openai?.connectedAt?.toISOString() ?? null}
      anthropicStatus={anthropic?.status ?? "not_connected"}
      anthropicConnectedAt={anthropic?.connectedAt?.toISOString() ?? null}
    />
  );
}

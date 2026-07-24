import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listIntegrations } from "@/server/platform/services/integrationCenterService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { IntegrationsClient } from "./IntegrationsClient";

export const metadata: Metadata = { title: "Integrations — 3Stone AI" };

// Founder-only (the layout above already gates /3stone-ai/*) — real
// status for every external service, computed live from actual
// configuration every time this page loads. Never hardcodes "Connected"
// for anything (see docs/18-architecture-inventory.md's note on the
// in-app customer-facing Integrations page's demo-fiction badges —
// this is the opposite of that, deliberately).
export default async function FounderIntegrationsPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const integrations = await listIntegrations();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_integrations" });

  return <IntegrationsClient integrations={integrations} />;
}

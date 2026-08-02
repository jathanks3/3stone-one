import type { Metadata } from "next";
import { AnalyticsClient } from "@/features/analytics/AnalyticsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";
import { RealAnalyticsClient } from "@/features/analytics/RealAnalyticsClient";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Analytics & Reports — 3Stone One" };

export default async function AnalyticsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) return <NotYetConnected moduleName="Analytics & Reports" />;
    const [projects, people, organizations, google] = await Promise.all([
      db.project.count({ where: { workspaceId } }),
      db.person.count({ where: { workspaceId } }),
      db.organization.count({ where: { workspaceId } }),
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    ]);
    return <RealAnalyticsClient counts={{ projects, people, organizations }} googleConnected={google?.status === "connected"} />;
  }
  return <AnalyticsClient />;
}

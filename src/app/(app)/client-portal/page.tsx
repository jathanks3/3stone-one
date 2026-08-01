import type { Metadata } from "next";
import { ClientPortalClient } from "@/features/client-portal/ClientPortalClient";
import { RealClientPortalClient } from "@/features/client-portal/RealClientPortalClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listOrgDeals, listOrganizationsForPortal, listSharedDocuments } from "@/server/services/clientPortalService";
import type { ClientPortalDealRow, ClientPortalDocumentRow } from "@/server/services/clientPortalService";

export const metadata: Metadata = { title: "Client Portal — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function ClientPortalPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) return <RealClientPortalClient organizations={[]} documentsByOrg={{}} dealsByOrg={{}} />;

    const organizations = await listOrganizationsForPortal(workspaceId);
    const documentsByOrg: Record<string, ClientPortalDocumentRow[]> = {};
    const dealsByOrg: Record<string, ClientPortalDealRow[]> = {};
    await Promise.all(
      organizations.map(async (o) => {
        [documentsByOrg[o.id], dealsByOrg[o.id]] = await Promise.all([
          listSharedDocuments(workspaceId, o.id),
          listOrgDeals(workspaceId, o.id),
        ]);
      })
    );

    return <RealClientPortalClient organizations={organizations} documentsByOrg={documentsByOrg} dealsByOrg={dealsByOrg} />;
  }
  return <ClientPortalClient />;
}

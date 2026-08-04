import type { Metadata } from "next";
import { CrmClient } from "@/features/crm/CrmClient";
import { RealCrmClient } from "@/features/crm/RealCrmClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listDeals, listOrganizations, listPeople } from "@/server/services/crmService";
import { db } from "@/server/db";
import { listWildApricotContacts } from "@/server/services/wildApricotIntegrationService";
import { listSalesforceAccounts, listSalesforceContacts, listSalesforceOpportunities } from "@/server/services/salesforceIntegrationService";

export const metadata: Metadata = { title: "CRM — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const [organizations, people, deals] = workspaceId
      ? await Promise.all([listOrganizations(workspaceId), listPeople(workspaceId), listDeals(workspaceId)])
      : [[], [], []];
    const wildApricot = workspaceId
      ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "wildapricot" } } })
      : null;
    const wildApricotContacts =
      workspaceId && wildApricot?.status === "connected" ? await listWildApricotContacts(workspaceId).catch(() => []) : [];
    const salesforce = workspaceId ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "salesforce" } } }) : null;
    const [salesforceAccounts, salesforceContacts, salesforceOpportunities] = workspaceId && salesforce?.status === "connected"
      ? await Promise.all([listSalesforceAccounts(workspaceId).catch(() => []), listSalesforceContacts(workspaceId).catch(() => []), listSalesforceOpportunities(workspaceId).catch(() => [])]) : [[], [], []];
    return (
      <RealCrmClient
        initialOrganizations={organizations}
        initialPeople={people}
        initialDeals={deals}
        wildApricotConnected={wildApricot?.status === "connected"}
        wildApricotContacts={wildApricotContacts}
        salesforceConnected={salesforce?.status === "connected"}
        salesforceAccounts={salesforceAccounts}
        salesforceContacts={salesforceContacts}
        salesforceOpportunities={salesforceOpportunities}
      />
    );
  }
  return <CrmClient />;
}

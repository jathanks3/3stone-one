import type { Metadata } from "next";
import { CrmClient } from "@/features/crm/CrmClient";
import { RealCrmClient } from "@/features/crm/RealCrmClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listDeals, listOrganizations, listPeople } from "@/server/services/crmService";

export const metadata: Metadata = { title: "CRM — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const [organizations, people, deals] = workspaceId
      ? await Promise.all([listOrganizations(workspaceId), listPeople(workspaceId), listDeals(workspaceId)])
      : [[], [], []];
    return <RealCrmClient initialOrganizations={organizations} initialPeople={people} initialDeals={deals} />;
  }
  return <CrmClient />;
}

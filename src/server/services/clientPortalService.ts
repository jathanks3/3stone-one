import { db } from "@/server/db";

export interface ClientPortalOrgRow {
  id: string;
  name: string;
  sharedDocumentCount: number;
}

// A manager-facing preview of what a given client would see if they
// logged in - real shared documents (Documents' own "Share with client"
// visibility toggle - see documentService.ts) for a real CRM
// organization, not a separate client-login system. Building actual
// external client authentication (inviting a client, scoping their
// session to one organization) is a distinct, larger feature with its
// own product questions (how a client gets invited, what they can do
// beyond viewing) - this preview is the real, honest scope for now.
export async function listOrganizationsForPortal(workspaceId: string): Promise<ClientPortalOrgRow[]> {
  const orgs = await db.organization.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: { where: { visibility: "shared_with_client" } } } } },
  });
  return orgs.map((o) => ({ id: o.id, name: o.name, sharedDocumentCount: o._count.documents }));
}

export interface ClientPortalDocumentRow {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export async function listSharedDocuments(workspaceId: string, organizationId: string): Promise<ClientPortalDocumentRow[]> {
  const docs = await db.document.findMany({
    where: { workspaceId, organizationId, visibility: "shared_with_client" },
    orderBy: { createdAt: "desc" },
  });
  return docs.map((d) => ({ id: d.id, name: d.name, mimeType: d.mimeType, sizeBytes: d.sizeBytes, createdAt: d.createdAt }));
}

export interface ClientPortalDealRow {
  id: string;
  title: string;
  stageKey: string;
  value: number;
}

export async function listOrgDeals(workspaceId: string, organizationId: string): Promise<ClientPortalDealRow[]> {
  const deals = await db.deal.findMany({ where: { workspaceId, organizationId }, orderBy: { createdAt: "desc" } });
  return deals.map((d) => ({ id: d.id, title: d.title, stageKey: d.stageKey, value: Number(d.value) }));
}

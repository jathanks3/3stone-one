import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { PersonType } from "../../../generated/prisma/client";

export const PIPELINE_STAGE_ORDER = ["new_lead", "contacted", "proposal", "negotiation", "won", "lost"] as const;
export type PipelineStageKey = (typeof PIPELINE_STAGE_ORDER)[number];

export interface OrganizationRow {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: Date;
}

export interface PersonRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  organizationId: string | null;
  organizationName: string | null;
  personType: PersonType;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: Date;
}

export interface DealRow {
  id: string;
  title: string;
  value: number;
  stageKey: string;
  personId: string;
  personName: string;
  organizationId: string | null;
  organizationName: string | null;
}

async function ownerNames(ownerIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(ownerIds.filter((id): id is string => !!id))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

export async function listOrganizations(workspaceId: string): Promise<OrganizationRow[]> {
  const orgs = await db.organization.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  const names = await ownerNames(orgs.map((o) => o.ownerId));
  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    domain: o.domain,
    industry: o.industry,
    ownerId: o.ownerId,
    ownerName: o.ownerId ? names.get(o.ownerId) ?? "Former member" : null,
    createdAt: o.createdAt,
  }));
}

export async function createOrganization(workspaceId: string, ownerId: string, name: string, domain: string, industry: string): Promise<OrganizationRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Company name is required.");
  const org = await db.organization.create({ data: { workspaceId, name: trimmed, domain: domain.trim() || null, industry: industry.trim() || null, ownerId } });
  await logActivity(workspaceId, ownerId, "created_organization", "Organization", org.id, { name: trimmed });
  return { id: org.id, name: org.name, domain: org.domain, industry: org.industry, ownerId: org.ownerId, ownerName: null, createdAt: org.createdAt };
}

export async function deleteOrganization(workspaceId: string, orgId: string, actorId: string): Promise<void> {
  const existing = await db.organization.findFirst({ where: { id: orgId, workspaceId } });
  if (!existing) throw new Error("Company not found.");
  await db.organization.delete({ where: { id: orgId } });
  await logActivity(workspaceId, actorId, "deleted_organization", "Organization", orgId, { name: existing.name });
}

export async function listPeople(workspaceId: string): Promise<PersonRow[]> {
  const people = await db.person.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, include: { organization: { select: { name: true } } } });
  const names = await ownerNames(people.map((p) => p.ownerId));
  return people.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    organizationId: p.organizationId,
    organizationName: p.organization?.name ?? null,
    personType: p.personType,
    ownerId: p.ownerId,
    ownerName: p.ownerId ? names.get(p.ownerId) ?? "Former member" : null,
    createdAt: p.createdAt,
  }));
}

export interface CreatePersonInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  personType: PersonType;
}

export async function createPerson(workspaceId: string, ownerId: string, input: CreatePersonInput): Promise<PersonRow> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) throw new Error("First and last name are required.");
  const person = await db.person.create({
    data: {
      workspaceId,
      firstName,
      lastName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      organizationId: input.organizationId || null,
      personType: input.personType,
      ownerId,
    },
  });
  await logActivity(workspaceId, ownerId, "created_person", "Person", person.id, { name: `${firstName} ${lastName}` });
  return { id: person.id, firstName, lastName, email: person.email, phone: person.phone, organizationId: person.organizationId, organizationName: null, personType: person.personType, ownerId, ownerName: null, createdAt: person.createdAt };
}

export async function deletePerson(workspaceId: string, personId: string, actorId: string): Promise<void> {
  const existing = await db.person.findFirst({ where: { id: personId, workspaceId } });
  if (!existing) throw new Error("Person not found.");
  await db.person.delete({ where: { id: personId } });
  await logActivity(workspaceId, actorId, "deleted_person", "Person", personId, { name: `${existing.firstName} ${existing.lastName}` });
}

export async function listDeals(workspaceId: string): Promise<DealRow[]> {
  const deals = await db.deal.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { person: { select: { firstName: true, lastName: true } }, organization: { select: { name: true } } },
  });
  return deals.map((d) => ({
    id: d.id,
    title: d.title,
    value: Number(d.value),
    stageKey: d.stageKey,
    personId: d.personId,
    personName: `${d.person.firstName} ${d.person.lastName}`,
    organizationId: d.organizationId,
    organizationName: d.organization?.name ?? null,
  }));
}

export async function createDeal(workspaceId: string, ownerId: string, title: string, value: number, personId: string, organizationId: string | undefined): Promise<DealRow> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Deal title is required.");
  const person = await db.person.findFirst({ where: { id: personId, workspaceId } });
  if (!person) throw new Error("Select a valid contact for this deal.");
  const deal = await db.deal.create({
    data: { workspaceId, title: trimmed, value: Number.isFinite(value) ? value : 0, personId, organizationId: organizationId || null, stageKey: "new_lead", ownerId },
  });
  await logActivity(workspaceId, ownerId, "created_deal", "Deal", deal.id, { title: trimmed });
  return { id: deal.id, title: deal.title, value: Number(deal.value), stageKey: deal.stageKey, personId, personName: `${person.firstName} ${person.lastName}`, organizationId: deal.organizationId, organizationName: null };
}

export async function moveDealStage(workspaceId: string, dealId: string, actorId: string, stageKey: PipelineStageKey): Promise<void> {
  const existing = await db.deal.findFirst({ where: { id: dealId, workspaceId } });
  if (!existing) throw new Error("Deal not found.");
  const status = stageKey === "won" ? "won" : stageKey === "lost" ? "lost" : "open";
  await db.deal.update({ where: { id: dealId }, data: { stageKey, status } });
  await logActivity(workspaceId, actorId, "moved_deal_stage", "Deal", dealId, { stageKey });
}

export async function deleteDeal(workspaceId: string, dealId: string, actorId: string): Promise<void> {
  const existing = await db.deal.findFirst({ where: { id: dealId, workspaceId } });
  if (!existing) throw new Error("Deal not found.");
  await db.deal.delete({ where: { id: dealId } });
  await logActivity(workspaceId, actorId, "deleted_deal", "Deal", dealId, { title: existing.title });
}

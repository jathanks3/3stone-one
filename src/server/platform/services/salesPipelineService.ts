import { db } from "@/server/db";
import type { Prisma } from "../../../../generated/prisma/client";

export interface ProspectListItem {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  stage: string;
  createdAt: Date;
}

// 3Stone AI's own sales pipeline — people who are NOT customers yet
// (docs/15-company-platform-vision.md / the founder's onboarding
// charter: "these are different concepts"). A prospect that converts
// gets a Workspace via the real onboarding path and its stage moves to
// "won" here, but the two entities (SalesProspect, Workspace) stay
// separate — this table is never read by anything that computes
// customer lifecycle or onboarding progress.
export async function listProspects(): Promise<ProspectListItem[]> {
  const prospects = await db.salesProspect.findMany({
    where: { stage: { notIn: ["won", "lost"] } },
    orderBy: { createdAt: "desc" },
  });
  return prospects.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    businessName: p.businessName,
    stage: p.stage,
    createdAt: p.createdAt,
  }));
}

export async function createProspect(input: { name: string; email: string; businessName?: string }): Promise<void> {
  await db.salesProspect.create({
    data: { name: input.name, email: input.email, businessName: input.businessName },
  });
}

export async function updateProspectStage(id: string, stage: Prisma.SalesProspectUpdateInput["stage"]): Promise<void> {
  await db.salesProspect.update({ where: { id }, data: { stage } });
}

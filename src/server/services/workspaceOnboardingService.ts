import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";
import type { IndustryProfileKey } from "@/types";
import {
  createWorkspace,
  setBusinessInfo,
  selectIndustry,
  confirmProductAndEdition,
  selectPlan,
} from "./onboardingService";

export interface OnboardWorkspaceInput {
  workspaceName: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  industryProfileKey: IndustryProfileKey;
}

export interface OnboardWorkspaceResult {
  workspaceId: string;
  ownerUserId: string;
}

// The founder's *secondary* administrative path — for exceptional
// circumstances, imports, enterprise onboarding, or support (the
// onboarding charter's own words), never the primary way customers get
// onboarded. It composes onboardingService's exact same step functions
// rather than re-implementing workspace creation, so there is one real
// onboarding mechanism with two entry points (self-service wizard, this
// script), not two mechanisms that happen to produce similar results.
//
// The email-verification step is skipped here on purpose — the founder
// is vouching for the account directly (that's what makes this
// "exceptional"), not because verification doesn't matter for the
// self-service path, where it's fully enforced.
export async function onboardWorkspace(input: OnboardWorkspaceInput): Promise<OnboardWorkspaceResult> {
  const existingSlug = await db.workspace.findUnique({ where: { slug: input.slug } });
  if (existingSlug) {
    throw new Error(`Workspace slug "${input.slug}" is already taken.`);
  }

  const passwordHash = await hashPassword(input.ownerPassword);
  const user = await db.user.upsert({
    where: { email: input.ownerEmail },
    update: {},
    create: {
      email: input.ownerEmail,
      name: input.ownerName,
      passwordHash,
      emailVerifiedAt: new Date(), // founder is vouching for this account directly
    },
  });

  const { workspaceId } = await createWorkspace(user.id, input.slug);
  await setBusinessInfo(workspaceId, input.workspaceName);
  await selectIndustry(workspaceId, input.industryProfileKey);
  await confirmProductAndEdition(workspaceId);
  await selectPlan(workspaceId, "free");

  return { workspaceId, ownerUserId: user.id };
}

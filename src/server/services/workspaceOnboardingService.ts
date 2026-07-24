import { db } from "@/server/db";
import type { IndustryProfileKey } from "@/types";

export interface OnboardWorkspaceInput {
  workspaceName: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  industryProfileKey: IndustryProfileKey;
}

export interface OnboardWorkspaceResult {
  workspaceId: string;
  ownerUserId: string;
}

// The one real onboarding path — used for every workspace, starting with
// Carl's and identically for whoever comes after him. No special-casing:
// a future self-serve signup form calls this exact function with
// user-submitted values instead of values typed into a script by the
// founder: same service, different caller.
//
// industryProfileKey is a key into src/config/industry-profiles/* (the
// existing static terminology-map mechanism), not a row in the
// IndustryProfile table — that table exists in the schema per
// docs/03-database-schema.md but nothing writes to it yet; the app's
// current industry-labeling still reads the static config. Real,
// DB-backed IndustryProfile rows (so an industry's terminology can be
// edited without a code deploy) are a later conversion, not required to
// onboard a real workspace today.
export async function onboardWorkspace(input: OnboardWorkspaceInput): Promise<OnboardWorkspaceResult> {
  const ownerRole = await db.role.findFirst({ where: { name: "Owner", workspaceId: null, isSystemRole: true } });
  if (!ownerRole) {
    throw new Error("System role 'Owner' not seeded — run `npx prisma db seed` first.");
  }

  const existingWorkspace = await db.workspace.findUnique({ where: { slug: input.slug } });
  if (existingWorkspace) {
    throw new Error(`Workspace slug "${input.slug}" is already taken.`);
  }

  const user = await db.user.upsert({
    where: { email: input.ownerEmail },
    update: {},
    create: { email: input.ownerEmail, name: input.ownerName },
  });

  const workspace = await db.workspace.create({
    data: {
      name: input.workspaceName,
      slug: input.slug,
      industryProfileKey: input.industryProfileKey,
      // productKey/editionKey/lifecycleStageKey/plan all take their
      // schema defaults (3stone_one / business / lead / free) — real,
      // not fabricated: this genuinely is a brand-new, untouched
      // customer at the start of its actual lifecycle.
    },
  });

  await db.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: user.id, roleId: ownerRole.id, status: "active" },
  });

  await db.workspaceOnboardingState.create({
    data: { workspaceId: workspace.id, step: "created" },
  });

  return { workspaceId: workspace.id, ownerUserId: user.id };
}

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/server/services/emailService";
import type { IndustryProfileKey, WorkspacePlan } from "@/types";

async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// The one real self-service onboarding path (the founder's onboarding
// charter): every function here is used identically for customer #1
// (Carl) and customer #20,000 — nothing in this file branches on who's
// calling it. The founder's own "create a workspace for exceptional
// circumstances" script (workspaceOnboardingService.ts) composes these
// same primitives rather than duplicating the logic, so there is
// genuinely one onboarding mechanism, not two that happen to agree today.

// Used by every step-N page after workspace creation to find which
// workspace this user is mid-onboarding on — a session never carries
// workspaceId directly (see lib/session.ts), so every real lookup goes
// through the same WorkspaceMember query (app)/layout.tsx also uses.
export async function getActiveWorkspaceIdForUser(userId: string): Promise<string | null> {
  const membership = await db.workspaceMember.findFirst({
    where: { userId, status: "active" },
    orderBy: { joinedAt: "asc" },
    select: { workspaceId: true },
  });
  return membership?.workspaceId ?? null;
}

async function recordStep(workspaceId: string, stepKey: string) {
  await db.workspaceOnboardingProgress.upsert({
    where: { workspaceId_stepKey: { workspaceId, stepKey } },
    update: {},
    create: { workspaceId, stepKey },
  });
}

// --- Step 1-3: account, before any workspace exists ---------------------

export async function startSignup(email: string): Promise<{ userId: string; verificationToken: string; delivered: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing?.passwordHash) {
    throw new Error("An account with this email already exists.");
  }
  const user = await db.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail, name: normalizedEmail.split("@")[0] },
  });

  const token = randomBytes(32).toString("hex");
  await db.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
  });

  // The token mechanism itself is fully real (random, single-use,
  // expiring) regardless of whether delivery succeeds — sendEmail
  // reports back whether it actually sent (Google Workspace SMTP
  // configured) or only logged, and the caller (signup/actions.ts) only
  // shows the raw link on-screen in the latter case. Showing it
  // unconditionally once real delivery works would defeat the point of
  // email verification — anyone with page access could self-verify.
  const origin = await currentOrigin();
  const { delivered } = await sendEmail(
    {
      to: normalizedEmail,
      subject: "Verify your email — 3Stone One",
      text: `Verify your email to continue setting up your workspace: ${origin}/signup/verify?token=${token}`,
    },
    "email_verification"
  );

  return { userId: user.id, verificationToken: token, delivered };
}

export async function verifyEmailToken(token: string): Promise<{ userId: string }> {
  const record = await db.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("This verification link is invalid or has expired.");
  }
  await db.emailVerificationToken.update({ where: { token }, data: { usedAt: new Date() } });
  await db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
  return { userId: record.userId };
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.emailVerifiedAt) {
    throw new Error("Verify your email before setting a password.");
  }
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  const passwordHash = await hashPassword(password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
}

// --- Step 4: the workspace now exists; everything after this records a
// real WorkspaceOnboardingProgress row -----------------------------------

export async function createWorkspace(userId: string, slug: string): Promise<{ workspaceId: string }> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.emailVerifiedAt || !user.passwordHash) {
    throw new Error("Complete account verification before creating a workspace.");
  }
  const existingSlug = await db.workspace.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new Error(`"${slug}" is already taken.`);
  }
  const ownerRole = await db.role.findFirstOrThrow({
    where: { name: "Owner", workspaceId: null, isSystemRole: true },
  });

  const workspace = await db.workspace.create({
    data: { name: slug, slug }, // name is a placeholder until Business Information; productKey/editionKey/lifecycleStageKey/plan all take real schema defaults
  });
  await db.workspaceMember.create({
    data: { workspaceId: workspace.id, userId, roleId: ownerRole.id, status: "active" },
  });
  await recordStep(workspace.id, "workspace_created");
  return { workspaceId: workspace.id };
}

// --- Steps 5-11: the wizard, one function per step ----------------------

export async function setBusinessInfo(workspaceId: string, businessName: string): Promise<void> {
  await db.workspace.update({ where: { id: workspaceId }, data: { name: businessName } });
  await recordStep(workspaceId, "business_info_completed");
}

export async function selectIndustry(workspaceId: string, industryProfileKey: IndustryProfileKey): Promise<void> {
  await db.workspace.update({ where: { id: workspaceId }, data: { industryProfileKey } });
  await recordStep(workspaceId, "industry_selected");
}

// Product/Edition currently have exactly one real combination
// (3stone_one/business) — there is deliberately no picker UI offering a
// choice that doesn't exist yet; these steps just confirm the schema
// defaults are what they already are and record that the step happened,
// rather than presenting a fake "choose your product" screen with one
// enabled option pretending to be a real decision.
export async function confirmProductAndEdition(workspaceId: string): Promise<void> {
  await recordStep(workspaceId, "product_selected");
  await recordStep(workspaceId, "edition_selected");
}

export async function selectPlan(workspaceId: string, plan: WorkspacePlan): Promise<void> {
  await db.workspace.update({ where: { id: workspaceId }, data: { plan } });
  await db.subscription.upsert({
    where: { workspaceId },
    update: { plan, status: "trialing" },
    create: { workspaceId, plan, status: "trialing", trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) },
  });
  await recordStep(workspaceId, "plan_selected");
  await recordStep(workspaceId, "subscription_configured");
}

export async function acceptTerms(workspaceId: string, userId: string, ipAddress: string | null): Promise<void> {
  await db.legalAcceptance.create({
    data: { workspaceId, userId, documentType: "tos", documentVersion: "2026-07", ipAddress: ipAddress ?? undefined },
  });
  await recordStep(workspaceId, "terms_accepted");
}

export async function completeSetup(workspaceId: string): Promise<void> {
  await db.workspace.update({ where: { id: workspaceId }, data: { lifecycleStageKey: "trial" } });
}

// --- Post-signup milestones (steps 12-15) — triggered by real usage, not
// the wizard. team_invited is optional/skippable — recorded only if the
// owner actually invites someone. first_project_created and active can't
// be reached yet: there is no real "create a project" action anywhere in
// the app (Projects is still an unconverted mock module) — that's an
// honest gap, tracked in docs/17-production-readiness-checklist.md, not
// something to fake by recording the step without the real trigger. ---

export async function inviteTeamMember(workspaceId: string, email: string, ownerRoleName = "Member"): Promise<void> {
  const role = await db.role.findFirstOrThrow({
    where: { name: ownerRoleName, workspaceId: null, isSystemRole: true },
  });
  const user = await db.user.upsert({
    where: { email: email.trim().toLowerCase() },
    update: {},
    create: { email: email.trim().toLowerCase(), name: email.split("@")[0] },
  });
  await db.workspaceMember.create({
    data: { workspaceId, userId: user.id, roleId: role.id, status: "invited" },
  });
  await recordStep(workspaceId, "team_invited");
}

export async function recordFirstLogin(workspaceId: string): Promise<void> {
  await recordStep(workspaceId, "first_login");
}

import { db } from "@/server/db";
import { getOnboardingProgress } from "./onboardingProgressService";

// How long onboarding can go without a new completed step before the
// founder should be told it's stalled — the one heuristic in this file,
// applied only to real timestamps that are already recorded elsewhere
// (WorkspaceOnboardingProgress.completedAt / User.lastLoginAt). Never
// invents a number; it only decides when to surface one.
const STALL_THRESHOLD_MS = 1000 * 60 * 60 * 48; // 48 hours

export type WorkspaceHealth = "healthy" | "at_risk" | "stalled_onboarding" | "cancelled";

export interface CustomerListItem {
  id: string;
  name: string;
  productName: string;
  editionName: string;
  lifecycleStage: string;
  plan: string;
  mrrCents: number;
  createdAt: Date;
  onboardingPercentComplete: number;
  onboardingCurrentStepLabel: string;
  lastLoginAt: Date | null;
  lastActivityAt: Date;
  workspaceHealth: WorkspaceHealth;
  blocker: string | null;
}

// Every field here is a real, already-recorded timestamp or a threshold
// applied to one — never a fabricated score (the founder's onboarding
// charter: "Workspace health" / "Any blockers" must be real signals, same
// as onboarding percentage must be real steps, not an invented number).
async function getMonitoringSignals(
  workspaceId: string,
  workspaceCreatedAt: Date,
  lifecycleStageKey: string,
  isLifecycleTerminal: boolean,
  onboardingComplete: boolean,
  onboardingCurrentStepLabel: string
): Promise<Pick<CustomerListItem, "lastLoginAt" | "lastActivityAt" | "workspaceHealth" | "blocker">> {
  const [owner, lastProgress] = await Promise.all([
    db.workspaceMember.findFirst({
      where: { workspaceId, status: "active" },
      include: { user: { select: { lastLoginAt: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.workspaceOnboardingProgress.findFirst({
      where: { workspaceId },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
  ]);

  const lastLoginAt = owner?.user.lastLoginAt ?? null;
  const candidates = [lastLoginAt, lastProgress?.completedAt, workspaceCreatedAt].filter(
    (d): d is Date => d instanceof Date
  );
  const lastActivityAt = candidates.reduce((latest, d) => (d > latest ? d : latest), workspaceCreatedAt);

  const stalled =
    !onboardingComplete && Date.now() - lastActivityAt.getTime() > STALL_THRESHOLD_MS;

  let workspaceHealth: WorkspaceHealth = "healthy";
  let blocker: string | null = null;
  if (isLifecycleTerminal) {
    workspaceHealth = "cancelled";
  } else if (lifecycleStageKey === "at_risk") {
    workspaceHealth = "at_risk";
  } else if (stalled) {
    workspaceHealth = "stalled_onboarding";
    blocker = `No onboarding progress in over 48 hours — stuck on "${onboardingCurrentStepLabel}".`;
  }

  return { lastLoginAt, lastActivityAt, workspaceHealth, blocker };
}

// The first real Platform read — every "customer" is a Workspace, seen
// from the operator's side rather than the tenant's own. Deliberately
// read-only and unfiltered by permission scope beyond "caller is staff,"
// which the route handler already checked before calling this — no
// service function in src/server/platform/* re-checks staff access
// itself; that's the API/layout layers' job, not the service layer's.
export async function listCustomers(): Promise<CustomerListItem[]> {
  const workspaces = await db.workspace.findMany({
    include: {
      product: true,
      edition: true,
      lifecycleStage: true,
      subscription: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // One onboarding-progress query per workspace — fine at today's scale
  // (this is the founder's own customer list, not a customer-facing
  // page); worth batching if this ever needs to handle thousands of rows.
  return Promise.all(
    workspaces.map(async (w) => {
      const progress = await getOnboardingProgress(w.id);
      const signals = await getMonitoringSignals(
        w.id,
        w.createdAt,
        w.lifecycleStage.key,
        w.lifecycleStage.isTerminal,
        progress.percentComplete === 100,
        progress.currentStepLabel
      );
      return {
        id: w.id,
        name: w.name,
        productName: w.product.name,
        editionName: w.edition.name,
        lifecycleStage: w.lifecycleStage.label,
        plan: w.plan,
        mrrCents: w.subscription?.mrrCents ?? 0,
        createdAt: w.createdAt,
        onboardingPercentComplete: progress.percentComplete,
        onboardingCurrentStepLabel: progress.currentStepLabel,
        ...signals,
      };
    })
  );
}

export interface CustomerDetail extends CustomerListItem {
  ownerName: string;
  ownerEmail: string;
  slug: string;
}

// Customer 360 (minimal, real version) — the founder's charter's own
// field list is much longer (CRM stats, documents, support history,
// health score...); everything here is genuinely real today, and
// nothing else is faked to fill out the rest of that list early. See
// docs/17-production-readiness-checklist.md for what's still missing.
export async function getCustomerDetail(workspaceId: string): Promise<CustomerDetail | null> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { product: true, edition: true, lifecycleStage: true, subscription: true },
  });
  if (!workspace) return null;

  const owner = await db.workspaceMember.findFirst({
    where: { workspaceId, status: "active" },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  const progress = await getOnboardingProgress(workspaceId);
  const signals = await getMonitoringSignals(
    workspaceId,
    workspace.createdAt,
    workspace.lifecycleStage.key,
    workspace.lifecycleStage.isTerminal,
    progress.percentComplete === 100,
    progress.currentStepLabel
  );

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    productName: workspace.product.name,
    editionName: workspace.edition.name,
    lifecycleStage: workspace.lifecycleStage.label,
    plan: workspace.plan,
    mrrCents: workspace.subscription?.mrrCents ?? 0,
    createdAt: workspace.createdAt,
    onboardingPercentComplete: progress.percentComplete,
    onboardingCurrentStepLabel: progress.currentStepLabel,
    ownerName: owner?.user.name ?? "—",
    ownerEmail: owner?.user.email ?? "—",
    ...signals,
  };
}

import { db } from "@/server/db";

export interface OnboardingStepStatus {
  key: string;
  label: string;
  completed: boolean;
}

export interface OnboardingProgressSummary {
  steps: OnboardingStepStatus[];
  completedCount: number;
  totalSteps: number;
  percentComplete: number;
  currentStepLabel: string; // "Active" once every step is done
  nextStepLabel: string | null;
}

// The real computation behind Customer 360's progress bar (the founder's
// onboarding charter: "Do not calculate progress using fake percentages.
// Use actual completed onboarding steps."). account_created /
// email_verified / password_created are derived from the workspace
// owner's User fields rather than WorkspaceOnboardingProgress rows —
// see onboardingService.ts's OnboardingStepDefinition comment for why —
// everything else is a real row or it doesn't count.
export async function getOnboardingProgress(workspaceId: string): Promise<OnboardingProgressSummary> {
  const [allSteps, progress, owner] = await Promise.all([
    db.onboardingStepDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    db.workspaceOnboardingProgress.findMany({ where: { workspaceId } }),
    db.workspaceMember.findFirst({
      where: { workspaceId, status: "active" },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  const completedKeys = new Set(progress.map((p) => p.stepKey));
  if (owner) {
    completedKeys.add("account_created"); // the User row existing at all is the fact
    if (owner.user.emailVerifiedAt) completedKeys.add("email_verified");
    if (owner.user.passwordHash) completedKeys.add("password_created");
  }

  const steps = allSteps.map((s) => ({ key: s.key, label: s.label, completed: completedKeys.has(s.key) }));
  const completedCount = steps.filter((s) => s.completed).length;
  const firstIncompleteIndex = steps.findIndex((s) => !s.completed);
  // The next INCOMPLETE step after the current one — not simply the next
  // index. Optional/skippable steps (e.g. team_invited) can leave an
  // earlier step incomplete while a later one is already done (e.g. a
  // customer logs in again before ever inviting a teammate); "next step"
  // must never point at something already checked off.
  const nextIncomplete =
    firstIncompleteIndex === -1 ? undefined : steps.slice(firstIncompleteIndex + 1).find((s) => !s.completed);

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    percentComplete: steps.length ? Math.round((completedCount / steps.length) * 100) : 0,
    currentStepLabel: firstIncompleteIndex === -1 ? "Active" : steps[firstIncompleteIndex].label,
    nextStepLabel: nextIncomplete?.label ?? null,
  };
}

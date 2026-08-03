import { db } from "@/server/db";
import { getDailyDebrief, type DailyDebrief } from "@/server/services/debriefService";

export interface RealDashboardData {
  workspaceName: string;
  userName: string;
  editionKey: string;
  memberCount: number;
  openProjectCount: number;
  overdueProjectCount: number;
  unpaidInvoiceCount: number;
  recentActivity: { action: string; createdAt: Date }[];
  debrief: DailyDebrief;
  briefingSummary: string;
}

// Real, workspace-scoped counts — every query below is filtered by
// workspaceId, the multi-tenancy enforcement point
// (docs/01-architecture.md §3). For a brand-new workspace like Carl's,
// every count here is genuinely zero — that's not a bug to work around,
// it's the truthful empty state docs/15/the founder's charter both
// require instead of fabricated numbers.
//
// editionKey is returned alongside these so RealDashboard can decide
// which counts even make sense to show - real bug found here: every
// edition saw "Team members" and "Unpaid invoices" regardless of
// whether People or Finance are even in that edition's module list (see
// editionModules.ts - Student has neither, Workspace has no Finance).
export async function getDashboardData(workspaceId: string, userId: string): Promise<RealDashboardData> {
  const [workspace, user, memberCount, openProjectCount, overdueProjectCount, unpaidInvoiceCount, recentActivity] =
    await Promise.all([
      db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true, editionKey: true } }),
      db.user.findUnique({ where: { id: userId }, select: { name: true } }),
      db.workspaceMember.count({ where: { workspaceId, status: "active" } }),
      db.project.count({ where: { workspaceId, statusKey: { not: "done" } } }),
      db.project.count({ where: { workspaceId, statusKey: { not: "done" }, dueDate: { lt: new Date() } } }),
      db.invoice.count({ where: { workspaceId, status: { in: ["sent", "overdue"] } } }),
      db.activityLogEntry.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { action: true, createdAt: true },
      }),
    ]);

  const debrief = await getDailyDebrief(workspaceId, workspace.editionKey);

  // Same plain-English framing as the demo's generateMorningBriefing
  // (src/server/mock-data/index.ts), built from real counts instead of a
  // mock dataset - deliberately doesn't fabricate a "% up this month"
  // figure the schema can't back (Task has no completedAt to trend
  // against), so it leads with what's actually true right now instead.
  const projectWord = openProjectCount === 1 ? "project" : "projects";
  const openSentence = `You have ${openProjectCount} open ${projectWord}${overdueProjectCount > 0 ? `, ${overdueProjectCount} overdue` : ""}.`;
  const attentionSentence =
    debrief.attentionItems.length > 0
      ? ` ${debrief.attentionItems.length} item${debrief.attentionItems.length === 1 ? " needs" : "s need"} your attention.`
      : " Nothing is behind schedule right now.";
  const briefingSummary = `${openSentence}${attentionSentence}`;

  return {
    workspaceName: workspace.name,
    userName: user?.name ?? workspace.name,
    editionKey: workspace.editionKey,
    memberCount,
    openProjectCount,
    overdueProjectCount,
    unpaidInvoiceCount,
    recentActivity,
    debrief,
    briefingSummary,
  };
}

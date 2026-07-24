import { db } from "@/server/db";

export interface RealDashboardData {
  workspaceName: string;
  memberCount: number;
  openProjectCount: number;
  overdueProjectCount: number;
  unpaidInvoiceCount: number;
  recentActivity: { action: string; createdAt: Date }[];
}

// Real, workspace-scoped counts — every query below is filtered by
// workspaceId, the multi-tenancy enforcement point
// (docs/01-architecture.md §3). For a brand-new workspace like Carl's,
// every count here is genuinely zero — that's not a bug to work around,
// it's the truthful empty state docs/15/the founder's charter both
// require instead of fabricated numbers.
export async function getDashboardData(workspaceId: string): Promise<RealDashboardData> {
  const [workspace, memberCount, openProjectCount, overdueProjectCount, unpaidInvoiceCount, recentActivity] =
    await Promise.all([
      db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } }),
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

  return {
    workspaceName: workspace.name,
    memberCount,
    openProjectCount,
    overdueProjectCount,
    unpaidInvoiceCount,
    recentActivity,
  };
}

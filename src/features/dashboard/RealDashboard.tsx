import { Card } from "@/ui/Card";
import type { RealDashboardData } from "@/server/services/dashboardService";

// A genuine Server Component, not "use client" — nothing here is
// interactive, and it's already fed server-resolved data, so there's no
// reason to ship it as client JS. This is what a truthful empty state
// looks like (docs/15-company-platform-vision.md, the founder's
// production charter): every number is real, most of them are
// legitimately zero for a workspace that's just been created, and
// nothing here is dressed up to look otherwise.
export function RealDashboard({ data }: { data: RealDashboardData }) {
  const hasAnyActivity =
    data.openProjectCount > 0 || data.unpaidInvoiceCount > 0 || data.recentActivity.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">{data.workspaceName}</h1>
        <p className="text-[14px] text-ink-2">
          {hasAnyActivity
            ? "Here's what's happening in your workspace."
            : "Your workspace is ready. Nothing here yet — invite your team, or add your first project or invoice to get started."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11.5px] text-ink-3">Team members</p>
          <p className="mt-1 text-[22px] font-bold text-ink-1">{data.memberCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11.5px] text-ink-3">Open projects</p>
          <p className="mt-1 text-[22px] font-bold text-ink-1">{data.openProjectCount}</p>
          {data.overdueProjectCount > 0 ? (
            <p className="mt-1 text-[12px] text-critical">{data.overdueProjectCount} overdue</p>
          ) : null}
        </Card>
        <Card className="p-4">
          <p className="text-[11.5px] text-ink-3">Unpaid invoices</p>
          <p className="mt-1 text-[22px] font-bold text-ink-1">{data.unpaidInvoiceCount}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-[15px] font-bold text-ink-1">Recent activity</h2>
        {data.recentActivity.length > 0 ? (
          <div className="mt-3 divide-y divide-line">
            {data.recentActivity.map((entry, i) => (
              <div key={i} className="py-2.5 text-[13px] text-ink-2">
                {entry.action} · {entry.createdAt.toLocaleDateString()}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-ink-3">No activity yet.</p>
        )}
      </Card>
    </div>
  );
}

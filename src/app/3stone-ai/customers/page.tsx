import type { Metadata } from "next";
import Link from "next/link";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listCustomers } from "@/server/platform/services/customerService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { Badge } from "@/ui/Badge";
import type { WorkspaceHealth } from "@/server/platform/services/customerService";

export const metadata: Metadata = { title: "Customers — 3Stone AI" };

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

const HEALTH_TONE: Record<WorkspaceHealth, "good" | "warning" | "critical" | "neutral"> = {
  healthy: "good",
  at_risk: "warning",
  stalled_onboarding: "warning",
  cancelled: "neutral",
};
const HEALTH_LABEL: Record<WorkspaceHealth, string> = {
  healthy: "Healthy",
  at_risk: "At Risk",
  stalled_onboarding: "Stalled",
  cancelled: "Cancelled",
};

// Real data, real audit trail — the first page in this section that
// actually reads Postgres instead of returning a placeholder. Viewing the
// full customer roster is exactly the kind of "sensitive action" docs/15
// means by "every entry is audited": it's a cross-tenant read of every
// workspace on the platform, not scoped to one company the way everything
// else a staff member might look at day-to-day is.
export default async function CustomersPage() {
  // The layout above already redirects anyone without staff access before
  // this ever renders — hasStaffAccess narrows the session's type here
  // (staffRole becomes non-optional) so recordAuditEntry's staffUserId
  // isn't threading an `| undefined` through for no reason.
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    // Unreachable in practice (the layout already redirected), but a
    // service that writes an audit log keyed on staffUserId should never
    // be called with a session that hasn't been proven to have one.
    return null;
  }

  const customers = await listCustomers();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_customers_list" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Customers</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">{customers.length} workspaces</p>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">Workspace</th>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 font-medium">Edition</th>
              <th className="px-4 py-2.5 font-medium">Lifecycle</th>
              <th className="px-4 py-2.5 font-medium">Plan</th>
              <th className="px-4 py-2.5 font-medium">MRR</th>
              <th className="px-4 py-2.5 font-medium">Onboarding</th>
              <th className="px-4 py-2.5 font-medium">Health</th>
              <th className="px-4 py-2.5 font-medium">Last activity</th>
              <th className="px-4 py-2.5 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface">
                <td className="px-4 py-2.5 font-medium text-ink-1">
                  <Link href={`/3stone-ai/customers/${c.id}`} className="hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-ink-2">{c.productName}</td>
                <td className="px-4 py-2.5 text-ink-2">{c.editionName}</td>
                <td className="px-4 py-2.5 text-ink-2">{c.lifecycleStage}</td>
                <td className="px-4 py-2.5 text-ink-2">{c.plan}</td>
                <td className="px-4 py-2.5 text-ink-2">{formatMoney(c.mrrCents)}</td>
                <td className="px-4 py-2.5 text-ink-2">
                  {c.onboardingPercentComplete}%
                  {c.onboardingPercentComplete < 100 ? (
                    <span className="ml-1.5 text-ink-3">({c.onboardingCurrentStepLabel})</span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={HEALTH_TONE[c.workspaceHealth]} className={c.blocker ? "cursor-help" : undefined}>
                    <span title={c.blocker ?? undefined}>{HEALTH_LABEL[c.workspaceHealth]}</span>
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-ink-2">{formatDate(c.lastActivityAt)}</td>
                <td className="px-4 py-2.5 text-ink-2">{formatDate(c.lastLoginAt)}</td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-ink-3">
                  No customers have signed up yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

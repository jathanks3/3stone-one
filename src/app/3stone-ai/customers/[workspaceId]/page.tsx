import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getSession, hasStaffAccess } from "@/lib/session";
import { getCustomerDetail } from "@/server/platform/services/customerService";
import type { WorkspaceHealth } from "@/server/platform/services/customerService";
import { getOnboardingProgress } from "@/server/platform/services/onboardingProgressService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { Badge } from "@/ui/Badge";

export const metadata: Metadata = { title: "Customer 360 — 3Stone AI" };

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

// Customer 360 (minimal, real version) — read-only, exactly as the
// founder's onboarding charter specifies. The full field list from
// docs/15 (CRM stats, documents, support history, health score, recent
// errors...) is a much longer document than this; everything shown here
// is genuinely real today, and the rest isn't faked in to look more
// complete than it is — see docs/17-production-readiness-checklist.md.
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects; see /3stone-ai/customers' own comment

  const { workspaceId } = await params;
  const customer = await getCustomerDetail(workspaceId);
  if (!customer) notFound();

  const progress = await getOnboardingProgress(workspaceId);
  await recordAuditEntry({
    staffUserId: session.userId,
    action: "viewed_customer_detail",
    targetWorkspaceId: workspaceId,
    targetEntityType: "workspace",
    targetEntityId: workspaceId,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/3stone-ai/customers" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent">
        <ArrowLeft size={14} />
        Back to Customers
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">{customer.name}</h1>
          <p className="mt-1 text-[13px] text-ink-3">
            {customer.ownerName} · {customer.ownerEmail} · /{customer.slug}
          </p>
        </div>
        <Badge tone={HEALTH_TONE[customer.workspaceHealth]}>{HEALTH_LABEL[customer.workspaceHealth]}</Badge>
      </div>

      {customer.blocker ? (
        <div className="mt-4 rounded-[10px] border border-warning/30 bg-warning-wash px-4 py-2.5 text-[13px] text-warning-ink">
          {customer.blocker}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Product", customer.productName],
          ["Edition", customer.editionName],
          ["Lifecycle", customer.lifecycleStage],
          ["Plan / MRR", `${customer.plan} · ${formatMoney(customer.mrrCents)}`],
          ["Last activity", formatDate(customer.lastActivityAt)],
          ["Last login", formatDate(customer.lastLoginAt)],
          ["Created", formatDate(customer.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[10px] border border-line bg-surface p-3">
            <p className="text-[11px] text-ink-3">{label}</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-ink-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[12px] border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold text-ink-1">Onboarding</h2>
          <p className="text-[13px] font-semibold text-ink-1">{progress.percentComplete}% complete</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-ink-3">Current step</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-ink-1">{progress.currentStepLabel}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-3">Next step</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-ink-1">{progress.nextStepLabel ?? "—"}</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-line border-t border-line">
          {progress.steps.map((step) => (
            <div key={step.key} className="flex items-center gap-2.5 py-2 text-[13px]">
              <div
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                  step.completed ? "bg-accent text-on-accent" : "border border-line-strong"
                }`}
              >
                {step.completed ? <Check size={10} strokeWidth={3} /> : null}
              </div>
              <span className={step.completed ? "text-ink-1" : "text-ink-3"}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { isPicksStatsConfigured, getPicksStats } from "@/server/platform/services/picksStatsService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
  inner_circle: "Inner Circle",
};

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const metadata: Metadata = { title: "3Stone Picks — 3Stone AI" };

// The real cross-product integration for Picks: calls Picks' own
// staff-only stats API (see picksStatsService.ts) rather than reading a
// database directly - Picks runs on its own separate Supabase project.
export default async function PicksStatsPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  if (!isPicksStatsConfigured()) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">3Stone Picks</h1>
        <p className="mt-2 text-[13.5px] text-critical">
          Not configured — PICKS_STAFF_KEY is missing from this project&apos;s environment variables.
        </p>
      </div>
    );
  }

  const stats = await getPicksStats();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_picks_stats" });

  if (!stats) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">3Stone Picks</h1>
        <p className="mt-2 text-[13.5px] text-critical">
          Could not reach 3Stone Picks&apos; stats endpoint. It may be down, or the shared key may not match.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">3Stone Picks</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Real subscriber counts and revenue, read live from 3stonepicks.3stoneai.com. No customer personal info.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
            Monthly Recurring Revenue
          </span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{formatUsd(stats.mrr)}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Active Subscribers</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.activeSubscribers}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Total Signups</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.totalSignups}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Free Trials Used</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.freeTrialUsed}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(TIER_LABELS).map(([tier, label]) => (
          <div key={tier} className="rounded-[12px] border border-line bg-surface p-4">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{label}</span>
            <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.byTier[tier] ?? 0}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] text-ink-3">
        As of {new Date(stats.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

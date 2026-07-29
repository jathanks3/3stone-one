import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { isCounselStatsConfigured, getCounselStats } from "@/server/platform/services/counselStatsService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export const metadata: Metadata = { title: "3Stone Counsel — 3Stone AI" };

// The real cross-product integration for Counsel: calls Counsel's own
// staff-only stats API (see counselStatsService.ts) rather than reading a
// database directly - Counsel runs on its own separate Supabase project.
// No revenue/MRR here (unlike Picks) - Counsel has no billing yet.
export default async function CounselStatsPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  if (!isCounselStatsConfigured()) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">3Stone Counsel</h1>
        <p className="mt-2 text-[13.5px] text-critical">
          Not configured — COUNSEL_STAFF_KEY is missing from this project&apos;s environment variables.
        </p>
      </div>
    );
  }

  const stats = await getCounselStats();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_counsel_stats" });

  if (!stats) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">3Stone Counsel</h1>
        <p className="mt-2 text-[13.5px] text-critical">
          Could not reach 3Stone Counsel&apos;s stats endpoint. It may be down, or the shared key may not match.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">3Stone Counsel</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Real signup and case counts, read live from Counsel&apos;s own stats API. No customer personal info,
        no revenue yet — Counsel has no billing wired up.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Total Signups</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.totalSignups}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Total Cases</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.totalCases}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Active Cases</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.activeCases}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Completed Cases</span>
          <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.completedCases}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(stats.byArea).map(([area, count]) => (
          <div key={area} className="rounded-[12px] border border-line bg-surface p-4">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{area.replace(/-/g, " ")}</span>
            <p className="mt-1 text-[20px] font-bold text-ink-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[12px] border border-line bg-surface p-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">Total AI Guidance Calls</span>
        <p className="mt-1 text-[20px] font-bold text-ink-1">{stats.totalGuidanceCalls}</p>
      </div>

      <p className="mt-4 text-[11.5px] text-ink-3">
        As of {new Date(stats.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { db } from "@/server/db";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export const metadata: Metadata = { title: "System Health — 3Stone AI" };

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number | null; error: string | null }> {
  const start = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - start), error: null };
  } catch (e) {
    return { ok: false, latencyMs: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-good" : "bg-critical"}`}
      aria-label={ok ? "Healthy" : "Unhealthy"}
    />
  );
}

// Real, measured signals only — no synthetic uptime percentage, no fake
// SLA number. Third-party credential status (Stripe/Storage/Email) lives
// on the Integrations page already; this page is infra reachability, not
// a duplicate of that.
export default async function SystemHealthPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const database = await checkDatabase();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_system_health" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">System Health</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">Real, measured infrastructure status — nothing synthetic.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[12px] border border-line bg-surface p-4">
          <div className="flex items-center gap-2">
            <StatusDot ok={database.ok} />
            <span className="font-medium text-ink-1">Database (Neon Postgres)</span>
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            {database.ok ? `Reachable — ${database.latencyMs}ms round trip` : `Unreachable — ${database.error}`}
          </p>
        </div>
      </div>

      <p className="mt-6 text-[12.5px] text-ink-3">
        Checked at request time — this page always reflects current, not cached, status.
      </p>
    </div>
  );
}

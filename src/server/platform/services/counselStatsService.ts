// Real cross-product integration: calls 3Stone Counsel's own staff-only
// stats endpoint over HTTPS (not a direct DB connection - Counsel runs on
// a separate Supabase project this codebase has no other access to).
// Same pattern as picksStatsService.ts. The shared secret (COUNSEL_STAFF_KEY)
// is the same value as Counsel's own STAFF_PREVIEW_KEY, set once in this
// project's Vercel env vars.
const COUNSEL_BASE_URL = "https://counsel.3stoneai.com";

export interface CounselStats {
  totalSignups: number;
  totalCases: number;
  activeCases: number;
  completedCases: number;
  byArea: Record<string, number>;
  byStatus: Record<string, number>;
  totalGuidanceCalls: number;
  generatedAt: string;
}

export function isCounselStatsConfigured(): boolean {
  return Boolean(process.env.COUNSEL_STAFF_KEY);
}

export async function getCounselStats(): Promise<CounselStats | null> {
  const key = process.env.COUNSEL_STAFF_KEY;
  if (!key) return null;

  const res = await fetch(`${COUNSEL_BASE_URL}/api/staff/stats`, {
    headers: { "x-staff-key": key },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as CounselStats;
}

// Real cross-product integration: calls 3Stone Picks' own staff-only stats
// endpoint over HTTPS (not a direct DB connection - Picks runs on a
// separate Supabase project this codebase has no other access to). The
// shared secret (PICKS_STAFF_KEY) is the same value as Picks' own
// STAFF_PREVIEW_KEY, set once in this project's Vercel env vars.
const PICKS_BASE_URL = "https://3stonepicks.3stoneai.com";

export interface PicksStats {
  activeSubscribers: number;
  byTier: Record<string, number>;
  mrr: number;
  totalSignups: number;
  freeTrialUsed: number;
  generatedAt: string;
}

export function isPicksStatsConfigured(): boolean {
  return Boolean(process.env.PICKS_STAFF_KEY);
}

export async function getPicksStats(): Promise<PicksStats | null> {
  const key = process.env.PICKS_STAFF_KEY;
  if (!key) return null;

  const res = await fetch(`${PICKS_BASE_URL}/api/staff/stats`, {
    headers: { "x-staff-key": key },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as PicksStats;
}

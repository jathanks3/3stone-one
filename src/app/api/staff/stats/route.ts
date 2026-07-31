import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/server/db";

// Same staff-key gate pattern as Picks/Counsel's api/staff/stats.ts -
// called server-to-server by 3Stone Admin's company revenue rollup, not
// from a browser, so no CORS handling needed. Real data: mrrCents is
// written by the actual Stripe webhook (stripeService.ts), not derived
// or estimated here.
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-staff-key");
  if (!process.env.ONE_STAFF_KEY || key !== process.env.ONE_STAFF_KEY) {
    return NextResponse.json({ error: "Invalid staff key." }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalSignups, activeSubscriptions, totalPageviews, pageviews7d] = await Promise.all([
    db.user.count(),
    db.subscription.findMany({
      where: { status: "active" },
      select: { mrrCents: true, workspace: { select: { editionKey: true } } },
    }),
    db.pageEvent.count({ where: { eventType: "pageview" } }),
    db.pageEvent.count({ where: { eventType: "pageview", occurredAt: { gte: sevenDaysAgo } } }),
  ]);

  const byEdition: Record<string, { subscribers: number; mrrCents: number }> = {};
  let mrrCents = 0;
  for (const sub of activeSubscriptions) {
    mrrCents += sub.mrrCents;
    const edition = sub.workspace.editionKey;
    byEdition[edition] ??= { subscribers: 0, mrrCents: 0 };
    byEdition[edition].subscribers += 1;
    byEdition[edition].mrrCents += sub.mrrCents;
  }

  return NextResponse.json({
    totalSignups,
    activeSubscribers: activeSubscriptions.length,
    mrr: mrrCents / 100,
    byEdition,
    totalPageviews,
    pageviews7d,
    generatedAt: new Date().toISOString(),
  });
}

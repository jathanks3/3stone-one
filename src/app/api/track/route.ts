import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/server/db";

// Ingestion endpoint for page-view/click analytics (see PageEvent in
// prisma/schema.prisma). Called from the client on every route change -
// see src/hooks/usePageTracking.ts. Deliberately minimal: no PII
// captured, best-effort (never blocks the page if it fails), and rate-
// limited per IP.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const { eventType, path, sessionId } = body ?? {};
  if (
    (eventType !== "pageview" && eventType !== "click") ||
    typeof path !== "string" ||
    typeof sessionId !== "string" ||
    path.length > 300 ||
    sessionId.length > 100
  ) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  await db.pageEvent.create({
    data: { eventType, path: path.slice(0, 300), sessionId: sessionId.slice(0, 100) },
  });

  return new NextResponse(null, { status: 204 });
}

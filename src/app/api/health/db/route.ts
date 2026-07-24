import { NextResponse } from "next/server";
import { db } from "@/server/db";

// Confirms the database is reachable — nothing else. Deliberately returns
// no hostname, connection string, error message, or stack trace: a health
// check is a reasonable thing to leave unauthenticated (proxy.ts's
// matcher already excludes /api from the session gate), so it must never
// become a source of infrastructure detail for anyone who finds the URL.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    // Logged server-side for whoever's operating this; the client-facing
    // response stays exactly as uninformative as the comment above requires.
    console.error("GET /api/health/db: database unreachable", e);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}

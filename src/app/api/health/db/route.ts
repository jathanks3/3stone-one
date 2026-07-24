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
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}

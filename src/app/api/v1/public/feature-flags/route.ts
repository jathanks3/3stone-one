import { NextResponse } from "next/server";
import { listFeatureFlags } from "@/server/platform/services/featureFlagService";

// Deliberately public — unlike everything under /api/v1/platform/* (staff
// session required), other 3Stone AI products (BetAI today; any future
// product) are anonymous client-side apps with no staff session to send.
// Feature flag on/off state isn't sensitive, so this is the one piece of
// Founder Platform data other products are allowed to read without auth —
// it's how "the founder controls every product from one place" actually
// reaches a product that has no backend of its own. Only key+enabled is
// exposed; label/description/createdAt stay internal.
// Cross-origin by design — BetAI (bet-ai-five.vercel.app) and any future
// product live on their own domains, not this one, and need to fetch this
// from browser JS with no cookies involved. Safe to allow any origin: the
// response carries no per-caller or sensitive data.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
};

export async function GET() {
  const flags = await listFeatureFlags();
  return NextResponse.json(
    { flags: flags.map((f) => ({ key: f.key, enabled: f.defaultEnabled })) },
    { headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

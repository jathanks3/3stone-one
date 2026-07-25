import { NextResponse } from "next/server";
import { getActivePublicAnnouncement } from "@/server/platform/services/announcementService";

// Same public, cross-origin contract as /api/v1/public/feature-flags — see
// that route's comment for why this is deliberately unauthenticated.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
};

export async function GET() {
  const announcement = await getActivePublicAnnouncement();
  return NextResponse.json({ announcement }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

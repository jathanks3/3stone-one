import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { completeSalesforceConnection, consumeSalesforceAuthState } from "@/server/services/salesforceIntegrationService";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const url = new URL(req.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return NextResponse.redirect(new URL("/integrations?error=access_denied", req.url));
  if (!code || !state) return NextResponse.redirect(new URL("/integrations?error=missing_code", req.url));
  const session = await getSession(); if (!session || session.isDemo) return NextResponse.redirect(new URL("/login", req.url));
  try { const auth = await consumeSalesforceAuthState(state); if (auth.userId !== session.userId) return NextResponse.redirect(new URL("/integrations?error=session_mismatch", req.url)); await completeSalesforceConnection(auth.workspaceId, auth.userId, code, `${url.origin}/api/integrations/salesforce/callback`); }
  catch (error) { console.error("[salesforce callback] failed", error); return NextResponse.redirect(new URL("/integrations?error=connection_failed", req.url)); }
  return NextResponse.redirect(new URL("/integrations?connected=salesforce", req.url));
}

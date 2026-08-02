import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { completeSlackConnection, consumeSlackAuthState } from "@/server/services/slackIntegrationService";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return NextResponse.redirect(new URL("/integrations?error=access_denied", req.url));
  if (!code || !state) return NextResponse.redirect(new URL("/integrations?error=missing_code", req.url));
  const session = await getSession();
  if (!session || session.isDemo) return NextResponse.redirect(new URL("/login", req.url));
  try {
    const auth = await consumeSlackAuthState(state);
    if (auth.userId !== session.userId) return NextResponse.redirect(new URL("/integrations?error=session_mismatch", req.url));
    await completeSlackConnection(auth.workspaceId, auth.userId, code, `${url.origin}/api/integrations/slack/callback`);
  } catch (e) {
    console.error("[api/integrations/slack/callback] failed:", e);
    return NextResponse.redirect(new URL("/integrations?error=connection_failed", req.url));
  }
  return NextResponse.redirect(new URL("/integrations?connected=slack", req.url));
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { consumeBasecampAuthState, completeBasecampConnection } from "@/server/services/basecampIntegrationService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(providerError)}`, req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?error=missing_code", req.url));
  }

  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { workspaceId, userId } = await consumeBasecampAuthState(state);
    if (userId !== session.userId) {
      return NextResponse.redirect(new URL("/integrations?error=session_mismatch", req.url));
    }
    const redirectUri = `${url.origin}/api/integrations/basecamp/callback`;
    await completeBasecampConnection(workspaceId, userId, code, redirectUri);
  } catch (e) {
    console.error("[api/integrations/basecamp/callback] failed:", e);
    return NextResponse.redirect(new URL("/integrations?error=connection_failed", req.url));
  }

  return NextResponse.redirect(new URL("/integrations?connected=basecamp", req.url));
}

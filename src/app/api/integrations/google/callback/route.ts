import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { consumeGoogleAuthState, completeGoogleConnection } from "@/server/services/googleIntegrationService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  if (providerError) {
    // The user clicked "Cancel" on Google's consent screen, or Google
    // itself rejected the request - either way, not a bug to log loudly.
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
    const { workspaceId, userId } = await consumeGoogleAuthState(state);
    // The state was minted for a specific user/workspace - a session
    // that doesn't match it isn't the same browser session that started
    // this connection, so refuse rather than attach tokens to the wrong
    // account.
    if (userId !== session.userId) {
      return NextResponse.redirect(new URL("/integrations?error=session_mismatch", req.url));
    }
    const redirectUri = `${url.origin}/api/integrations/google/callback`;
    await completeGoogleConnection(workspaceId, userId, code, redirectUri);
  } catch (e) {
    console.error("[api/integrations/google/callback] failed:", e);
    return NextResponse.redirect(new URL("/integrations?error=connection_failed", req.url));
  }

  return NextResponse.redirect(new URL("/integrations?connected=google", req.url));
}

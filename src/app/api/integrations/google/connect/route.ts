import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { requireTeamManager } from "@/server/services/teamService";
import { createGoogleAuthState, buildGoogleAuthUrl, isGoogleIntegrationConfigured } from "@/server/services/googleIntegrationService";

export const dynamic = "force-dynamic";

function redirectUri(req: Request): string {
  return `${new URL(req.url).origin}/api/integrations/google/callback`;
}

// Only a manager/owner can connect a workspace-wide integration - same
// guard every other workspace-level write in this app uses.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.userId, status: "active" },
    select: { workspaceId: true, workspace: { select: { editionKey: true } } },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await requireTeamManager(session.userId, membership.workspaceId);
  } catch {
    return NextResponse.redirect(new URL("/integrations?error=not_authorized", req.url));
  }

  if (!isGoogleIntegrationConfigured()) {
    return NextResponse.redirect(new URL("/integrations?error=not_configured", req.url));
  }

  const state = await createGoogleAuthState(membership.workspaceId, session.userId);
  const authUrl = buildGoogleAuthUrl(state, redirectUri(req), membership.workspace.editionKey);
  return NextResponse.redirect(authUrl);
}

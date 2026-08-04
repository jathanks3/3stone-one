import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { requireTeamManager } from "@/server/services/teamService";
import { createBasecampAuthState, buildBasecampAuthUrl, isBasecampIntegrationConfigured } from "@/server/services/basecampIntegrationService";

export const dynamic = "force-dynamic";

function redirectUri(req: Request): string {
  return `${new URL(req.url).origin}/api/integrations/basecamp/callback`;
}

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
  if (membership.workspace.editionKey !== "workspace") {
    return NextResponse.redirect(new URL("/integrations?error=not_available", req.url));
  }

  try {
    await requireTeamManager(session.userId, membership.workspaceId);
  } catch {
    return NextResponse.redirect(new URL("/integrations?error=not_authorized", req.url));
  }

  if (!isBasecampIntegrationConfigured()) {
    return NextResponse.redirect(new URL("/integrations?error=not_configured", req.url));
  }

  const state = await createBasecampAuthState(membership.workspaceId, session.userId);
  const authUrl = buildBasecampAuthUrl(state, redirectUri(req));
  return NextResponse.redirect(authUrl);
}

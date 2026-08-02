import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { requireTeamManager } from "@/server/services/teamService";
import {
  createMicrosoftAuthState,
  buildMicrosoftAuthUrl,
  isMicrosoftIntegrationConfigured,
} from "@/server/services/microsoftIntegrationService";

export const dynamic = "force-dynamic";

function redirectUri(req: Request): string {
  return `${new URL(req.url).origin}/api/integrations/microsoft/callback`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.userId, status: "active" },
    select: { workspaceId: true },
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

  if (!isMicrosoftIntegrationConfigured()) {
    return NextResponse.redirect(new URL("/integrations?error=not_configured", req.url));
  }

  const state = await createMicrosoftAuthState(membership.workspaceId, session.userId);
  const authUrl = buildMicrosoftAuthUrl(state, redirectUri(req));
  return NextResponse.redirect(authUrl);
}

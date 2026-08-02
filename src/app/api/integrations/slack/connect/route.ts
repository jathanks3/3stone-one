import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { requireTeamManager } from "@/server/services/teamService";
import { buildSlackAuthUrl, createSlackAuthState, isSlackIntegrationConfigured } from "@/server/services/slackIntegrationService";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.isDemo) return NextResponse.redirect(new URL("/login", req.url));
  const membership = await db.workspaceMember.findFirst({ where: { userId: session.userId, status: "active" }, select: { workspaceId: true }, orderBy: { joinedAt: "asc" } });
  if (!membership) return NextResponse.redirect(new URL("/login", req.url));
  try { await requireTeamManager(session.userId, membership.workspaceId); } catch { return NextResponse.redirect(new URL("/integrations?error=not_authorized", req.url)); }
  if (!isSlackIntegrationConfigured()) return NextResponse.redirect(new URL("/integrations?error=not_configured", req.url));
  const state = await createSlackAuthState(membership.workspaceId, session.userId);
  const redirectUri = `${new URL(req.url).origin}/api/integrations/slack/callback`;
  return NextResponse.redirect(buildSlackAuthUrl(state, redirectUri));
}

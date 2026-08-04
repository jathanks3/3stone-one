import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { getValidGoogleAccessToken } from "@/server/services/googleIntegrationService";
import { requireTeamManager } from "@/server/services/teamService";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.isDemo) return NextResponse.json({ error: "Sign in to choose Drive files." }, { status: 401 });

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.userId, status: "active" },
    select: { workspaceId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No active workspace was found." }, { status: 404 });

  try {
    await requireTeamManager(session.userId, membership.workspaceId);
    const accessToken = await getValidGoogleAccessToken(membership.workspaceId);
    return NextResponse.json({ accessToken }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google token unavailable." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { requireTeamManager } from "@/server/services/teamService";
import { saveSelectedGoogleDriveFiles } from "@/server/services/googleIntegrationService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.isDemo) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.userId, status: "active" },
    select: { workspaceId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No workspace found." }, { status: 403 });
  try {
    await requireTeamManager(session.userId, membership.workspaceId);
    const body = await req.json().catch(() => null) as { fileIds?: unknown } | null;
    const fileIds = Array.isArray(body?.fileIds) ? body.fileIds.filter((id): id is string => typeof id === "string") : [];
    if (!fileIds.length || fileIds.length > 100) return NextResponse.json({ error: "Choose between 1 and 100 files." }, { status: 400 });
    const files = await saveSelectedGoogleDriveFiles(membership.workspaceId, fileIds);
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Couldn't save selected files." }, { status: 400 });
  }
}

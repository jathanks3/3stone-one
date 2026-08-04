import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { getCanvasFileBytes } from "@/server/services/canvasIntegrationService";

export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const session = await getSession();
  if (!session || session.isDemo) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });
  await requireActiveMember(session.userId, workspaceId);

  try {
    const { fileId } = await context.params;
    const file = await getCanvasFileBytes(workspaceId, fileId);
    const body = new Blob([file.bytes], { type: file.contentType });
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${file.filename.replace(/["\r\n]/g, "")}"`,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Canvas file" }, { status: 404 });
  }
}

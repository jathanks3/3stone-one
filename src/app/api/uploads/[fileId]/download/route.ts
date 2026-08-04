import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { downloadPrivateFile } from "@/server/services/storageService";

// Secure inline preview by default. `?download=1` is the explicit download
// path. Both remain tenant checked before private storage bytes are fetched.
export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const { fileId } = await params;
  try {
    const file = await downloadPrivateFile(fileId, workspaceId);
    const forceDownload = new URL(request.url).searchParams.get("download") === "1";
    const safeFilename = file.filename.replace(/["\r\n]/g, "");
    const body = new Blob([file.bytes.slice().buffer as ArrayBuffer], { type: file.mimeType });
    return new NextResponse(body, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${safeFilename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Not found" }, { status: 404 });
  }
}

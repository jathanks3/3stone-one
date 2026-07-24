import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { createSignedDownloadUrl } from "@/server/services/storageService";

// Secure downloads: never returns the file bytes itself, and never
// returns a signed URL for a file outside the caller's own workspace —
// createSignedDownloadUrl re-checks that via the fileId+workspaceId pair
// before ever asking Supabase for a URL. Not yet wired into a real UI
// (Documents module is still mock — see docs/17-production-readiness-checklist.md);
// this route exists so that when it is, secure download already works.
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
    const url = await createSignedDownloadUrl(fileId, workspaceId);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Not found" }, { status: 404 });
  }
}

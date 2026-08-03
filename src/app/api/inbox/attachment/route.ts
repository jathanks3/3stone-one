import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { getGmailAttachmentBytes } from "@/server/services/googleIntegrationService";
import { getOutlookAttachmentBytes } from "@/server/services/microsoftIntegrationService";

// Streams one Gmail/Outlook attachment's real bytes for inline preview
// (an <img>/<iframe> src, the same "preview like the docs" pattern
// Documents uses for OneDrive/Drive/Canvas files - see
// RealDocumentsClient.tsx's previewFile DetailPanel). Distinct from
// saveAttachmentAction (emails/actions.ts): that one persists a copy into
// Documents: this one never stores anything, it just re-fetches the same
// bytes from the provider on every request, same "read-through only"
// rule as the rest of this module (see inboxService.ts).
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }
  await requireActiveMember(session.userId, workspaceId);

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const messageId = searchParams.get("messageId");
  const attachmentId = searchParams.get("attachmentId");
  const mimeType = searchParams.get("mimeType") || "application/octet-stream";
  const filename = searchParams.get("filename") || "attachment";
  if ((provider !== "google" && provider !== "microsoft") || !messageId || !attachmentId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const bytes =
      provider === "google"
        ? await getGmailAttachmentBytes(workspaceId, messageId, attachmentId)
        : await getOutlookAttachmentBytes(workspaceId, messageId, attachmentId);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't load attachment" }, { status: 404 });
  }
}

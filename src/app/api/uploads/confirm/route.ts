import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { recordUpload } from "@/server/services/storageService";
import { db } from "@/server/db";
import type { UploadedFileKind } from "../../../../../generated/prisma/client";

const VALID_KINDS: UploadedFileKind[] = ["avatar", "logo", "document"];

// Called by the client after it has already PUT the file bytes directly
// to Supabase using the signed URL from /api/uploads/sign — this route
// never sees the file content, only metadata, and is what actually
// creates the real Neon UploadedFile row + activity log entry.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const kind = body?.kind as UploadedFileKind | undefined;
  const storagePath = typeof body?.storagePath === "string" ? body.storagePath : undefined;
  const originalFilename = typeof body?.originalFilename === "string" ? body.originalFilename : undefined;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "application/octet-stream";
  const sizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : 0;
  if (!kind || !VALID_KINDS.includes(kind) || !storagePath || !originalFilename) {
    return NextResponse.json({ error: "kind, storagePath, and originalFilename are required" }, { status: 400 });
  }
  // The path itself is workspace-scoped (storageService.buildStoragePath
  // always embeds the workspaceId that requested the signed URL) — this
  // rejects a confirm call trying to attach someone else's upload to this
  // workspace's records.
  if (!storagePath.includes(`/${workspaceId}/`)) {
    return NextResponse.json({ error: "Path does not belong to this workspace" }, { status: 403 });
  }

  try {
    const { id, publicUrl } = await recordUpload({
      workspaceId,
      uploadedByUserId: session.userId,
      kind,
      storagePath,
      originalFilename,
      mimeType,
      sizeBytes,
    });

    if (kind === "avatar") {
      await db.user.update({ where: { id: session.userId }, data: { avatarUrl: publicUrl } });
    } else if (kind === "logo") {
      await db.workspace.update({ where: { id: workspaceId }, data: { logoUrl: publicUrl } });
    }

    return NextResponse.json({ id, publicUrl });
  } catch (e) {
    console.error("POST /api/uploads/confirm failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not record upload." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { createSignedUploadUrl } from "@/server/services/storageService";
import { assertStorageCapacity, UsageCapError } from "@/server/services/usageCapService";
import type { UploadedFileKind } from "../../../../../generated/prisma/client";

const VALID_KINDS: UploadedFileKind[] = ["avatar", "logo", "document"];

// Tenant isolation: workspaceId always comes from the caller's own
// session, never from the request body — the same rule every other
// mutation in this app follows (see Settings' actions.ts).
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
  const filename = typeof body?.filename === "string" ? body.filename : undefined;
  const sizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : undefined;
  if (!kind || !VALID_KINDS.includes(kind) || !filename || sizeBytes === undefined) {
    return NextResponse.json({ error: "kind, filename, and sizeBytes are required" }, { status: 400 });
  }

  // Checked here, before a signed URL ever exists - rejecting after the
  // bytes are already uploaded would waste the transfer for nothing.
  try {
    await assertStorageCapacity(workspaceId, sizeBytes);
  } catch (e) {
    if (e instanceof UsageCapError) {
      return NextResponse.json({ error: e.message }, { status: 402 });
    }
    throw e;
  }

  try {
    const signed = await createSignedUploadUrl(workspaceId, kind, filename);
    return NextResponse.json(signed);
  } catch (e) {
    console.error("POST /api/uploads/sign failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload is not available yet." }, { status: 503 });
  }
}

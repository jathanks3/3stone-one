import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/session";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";

const KNOWN_EDITION_KEYS = ["business", "workspace", "student"];

// Direct entry point for the marketing site's "Demo" links — starts (or
// resumes) the demo session and drops the visitor straight into the
// dashboard, with no login screen in between. See docs/14-first-run-experience.md.
//
// ?edition=workspace|student previews that edition's gated nav (see
// src/lib/editionModules.ts) instead of the full original product -
// lets a prospective Workspace/Student customer try the actual edition
// they're considering, not just the flagship. Re-creates the session
// whenever the requested edition differs from the current one, since a
// visitor might try one edition's demo, then come back for another.
export async function GET(request: Request) {
  const requestedEdition = new URL(request.url).searchParams.get("edition");
  const editionKey = requestedEdition && KNOWN_EDITION_KEYS.includes(requestedEdition) ? requestedEdition : "business";

  const session = await getSession();
  // A real (non-demo) session must never be touched here - only create/
  // recreate when there's no session at all, or the existing one is
  // itself a demo previewing a different edition.
  if (!session || (session.isDemo && session.demoEditionKey !== editionKey)) {
    await createSession({
      userId: DEMO_USER.id,
      workspaceId: DEMO_WORKSPACE.id,
      isDemo: true,
      demoEditionKey: editionKey,
      sessionVersion: 0,
    });
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

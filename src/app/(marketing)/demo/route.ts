import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/session";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";

const KNOWN_EDITION_KEYS = ["business", "workspace", "student"];

// Forces per-request execution - this reads a query param and a cookie
// and must never be served a cached response from a previous request
// (that would leak one visitor's demo edition into another's).
export const dynamic = "force-dynamic";

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
  const url = new URL(request.url);
  const requestedEdition = url.searchParams.get("edition");
  const editionKey = requestedEdition && KNOWN_EDITION_KEYS.includes(requestedEdition) ? requestedEdition : "business";
  // Founder-authored preset (see /3stone-ai/demo-profiles) - applies a
  // real prospect's org name/wording/color to this demo session instead
  // of the generic placeholder. Not validated against the DB here (this
  // route runs before Prisma is reachable from Edge in some deployments) -
  // (app)/layout.tsx does the real lookup and safely ignores a stale/bad id.
  const requestedProfileId = url.searchParams.get("profile") || undefined;

  const session = await getSession();
  // A real (non-demo) session must never be touched here - only create/
  // recreate when there's no session at all, or the existing one is
  // itself a demo previewing a different edition or a different profile.
  if (!session || (session.isDemo && (session.demoEditionKey !== editionKey || session.demoProfileId !== requestedProfileId))) {
    await createSession({
      userId: DEMO_USER.id,
      workspaceId: DEMO_WORKSPACE.id,
      isDemo: true,
      demoEditionKey: editionKey,
      ...(requestedProfileId ? { demoProfileId: requestedProfileId } : {}),
      sessionVersion: 0,
    });
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

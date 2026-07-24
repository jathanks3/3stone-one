import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/session";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";

// Direct entry point for the marketing site's "Demo" links — starts (or
// resumes) the demo session and drops the visitor straight into the
// dashboard, with no login screen in between. See docs/14-first-run-experience.md.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    await createSession({ userId: DEMO_USER.id, workspaceId: DEMO_WORKSPACE.id, isDemo: true });
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

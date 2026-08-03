import type { Metadata } from "next";
import { GpaClient } from "@/features/gpa/GpaClient";
import { RealGpaClient } from "@/features/gpa/RealGpaClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listGpaCourses, syncCanvasGradesIntoGpa } from "@/server/services/gpaService";

export const metadata: Metadata = { title: "GPA Calculator — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function GpaPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (workspaceId) {
      // Read-through sync from Canvas, same "do it on page load" pattern
      // as calendarService's Google/Outlook/Canvas merge - a no-op if
      // Canvas isn't connected (see getConnectedCanvas), so this never
      // slows down or breaks the page for anyone who hasn't connected it.
      await syncCanvasGradesIntoGpa(workspaceId, session.userId);
    }
    const courses = workspaceId ? await listGpaCourses(workspaceId, session.userId) : [];
    return <RealGpaClient initialCourses={courses} />;
  }
  return <GpaClient />;
}

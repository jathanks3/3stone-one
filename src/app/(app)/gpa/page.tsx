import type { Metadata } from "next";
import { GpaClient } from "@/features/gpa/GpaClient";
import { RealGpaClient } from "@/features/gpa/RealGpaClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listGpaCourses } from "@/server/services/gpaService";

export const metadata: Metadata = { title: "GPA Calculator — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function GpaPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const courses = workspaceId ? await listGpaCourses(workspaceId, session.userId) : [];
    return <RealGpaClient initialCourses={courses} />;
  }
  return <GpaClient />;
}

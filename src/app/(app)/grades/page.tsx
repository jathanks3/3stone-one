import type { Metadata } from "next";
import { GradesClient } from "@/features/grades/GradesClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listAllGrades, type GradeRow } from "@/server/services/gradesService";

export const metadata: Metadata = { title: "Grades — 3Stone One" };
export const dynamic = "force-dynamic";

// Clearly-fake example rows for the demo/logged-out experience - Grades
// has no interactivity to demo (see GradesClient.tsx), just real Canvas
// data or nothing, so a couple of illustrative rows are enough to show
// what it looks like once connected.
const DEMO_GRADES: GradeRow[] = [
  { courseId: "demo-1", courseName: "Intro to Psychology", currentScore: 94, currentGrade: "A", source: "canvas" },
  { courseId: "demo-2", courseName: "Calculus II", currentScore: 87, currentGrade: "B+", source: "canvas" },
  { courseId: "demo-3", courseName: "American Literature", currentScore: 91, currentGrade: "A-", source: "canvas" },
];

export default async function GradesPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const grades = workspaceId ? await listAllGrades(workspaceId) : [];
    return <GradesClient grades={grades} />;
  }
  return <GradesClient grades={DEMO_GRADES} />;
}

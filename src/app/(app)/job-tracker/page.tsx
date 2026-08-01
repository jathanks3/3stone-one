import type { Metadata } from "next";
import { JobTrackerClient } from "@/features/job-tracker/JobTrackerClient";
import { RealJobTrackerClient } from "@/features/job-tracker/RealJobTrackerClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listJobApplications } from "@/server/services/jobApplicationService";

export const metadata: Metadata = { title: "Internship & Job Tracker — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function JobTrackerPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const applications = workspaceId ? await listJobApplications(workspaceId, session.userId) : [];
    return <RealJobTrackerClient initialApplications={applications} />;
  }
  return <JobTrackerClient />;
}

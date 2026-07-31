import type { Metadata } from "next";
import { JobTrackerClient } from "@/features/job-tracker/JobTrackerClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Internship & Job Tracker — 3Stone One" };

export default async function JobTrackerPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Internship & Job Tracker" />;
  }
  return <JobTrackerClient />;
}

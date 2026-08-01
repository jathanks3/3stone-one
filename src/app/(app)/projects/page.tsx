import type { Metadata } from "next";
import { ProjectsClient } from "@/features/projects/ProjectsClient";
import { RealProjectsClient } from "@/features/projects/RealProjectsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listProjects } from "@/server/services/projectService";

export const metadata: Metadata = { title: "Projects — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const projects = workspaceId ? await listProjects(workspaceId) : [];
    return <RealProjectsClient initialProjects={projects} />;
  }
  return <ProjectsClient />;
}

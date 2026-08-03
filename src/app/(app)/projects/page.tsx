import type { Metadata } from "next";
import { ProjectsClient } from "@/features/projects/ProjectsClient";
import { RealProjectsClient } from "@/features/projects/RealProjectsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listProjects } from "@/server/services/projectService";
import { db } from "@/server/db";
import { listBasecampProjects } from "@/server/services/basecampIntegrationService";

export const metadata: Metadata = { title: "Projects — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const projects = workspaceId ? await listProjects(workspaceId) : [];
    const basecamp = workspaceId
      ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "basecamp" } } })
      : null;
    const basecampProjects =
      workspaceId && basecamp?.status === "connected" ? await listBasecampProjects(workspaceId).catch(() => []) : [];
    return (
      <RealProjectsClient
        initialProjects={projects}
        basecampConnected={basecamp?.status === "connected"}
        basecampProjects={basecampProjects}
      />
    );
  }
  return <ProjectsClient />;
}

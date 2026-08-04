import type { Metadata } from "next";
import { ProjectsClient } from "@/features/projects/ProjectsClient";
import { RealProjectsClient } from "@/features/projects/RealProjectsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listProjects } from "@/server/services/projectService";
import { db } from "@/server/db";
import { listBasecampProjects } from "@/server/services/basecampIntegrationService";
import { listCanvasAssignments } from "@/server/services/canvasIntegrationService";
import { listMondayBoards, listMondayItems } from "@/server/services/mondayIntegrationService";

export const metadata: Metadata = { title: "Projects — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const projects = workspaceId ? await listProjects(workspaceId) : [];
    const [basecamp, canvas, monday] = workspaceId ? await Promise.all([
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "basecamp" } } }),
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } }),
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "monday" } } }),
    ]) : [null, null, null];
    const basecampProjects =
      workspaceId && basecamp?.status === "connected" ? await listBasecampProjects(workspaceId).catch(() => []) : [];
    const canvasAssignments =
      workspaceId && canvas?.status === "connected" ? await listCanvasAssignments(workspaceId).catch(() => []) : [];
    const mondayBoards =
      workspaceId && monday?.status === "connected" ? await listMondayBoards(workspaceId).catch(() => []) : [];
    const mondayItems =
      workspaceId && monday?.status === "connected" ? await listMondayItems(workspaceId).catch(() => []) : [];
    return (
      <RealProjectsClient
        initialProjects={projects}
        basecampConnected={basecamp?.status === "connected"}
        basecampProjects={basecampProjects}
        canvasConnected={canvas?.status === "connected"}
        canvasAssignments={canvasAssignments}
        mondayConnected={monday?.status === "connected"}
        mondayBoards={mondayBoards}
        mondayItems={mondayItems}
      />
    );
  }
  return <ProjectsClient />;
}

import type { Metadata } from "next";
import { KnowledgeClient } from "@/features/knowledge/KnowledgeClient";
import { RealKnowledgeClient } from "@/features/knowledge/RealKnowledgeClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listKnowledgeArticles } from "@/server/services/knowledgeService";
import { db } from "@/server/db";
import { listCanvasCourseMaterials } from "@/server/services/canvasIntegrationService";
import { listDocuments } from "@/server/services/documentService";
import { getRecentOneDriveFiles } from "@/server/services/microsoftIntegrationService";
import { getRecentGoogleDriveFiles } from "@/server/services/googleIntegrationService";

export const metadata: Metadata = { title: "Knowledge Center — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const articles = workspaceId ? await listKnowledgeArticles(workspaceId) : [];
    const documents = workspaceId ? await listDocuments(workspaceId) : [];
    const [canvas, microsoft, google] = workspaceId ? await Promise.all([
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } }),
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }),
      db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }),
    ]) : [null, null, null];
    const [canvasMaterials, oneDriveFiles, googleDriveFiles] = workspaceId ? await Promise.all([
      canvas?.status === "connected" ? listCanvasCourseMaterials(workspaceId).catch(() => []) : Promise.resolve([]),
      microsoft?.status === "connected" ? getRecentOneDriveFiles(workspaceId).catch(() => []) : Promise.resolve([]),
      google?.status === "connected" ? getRecentGoogleDriveFiles(workspaceId).catch(() => []) : Promise.resolve([]),
    ]) : [[], [], []];
    return <RealKnowledgeClient initialArticles={articles} documents={documents} oneDriveFiles={oneDriveFiles} googleDriveFiles={googleDriveFiles} canvasMaterials={canvasMaterials} />;
  }
  return <KnowledgeClient />;
}

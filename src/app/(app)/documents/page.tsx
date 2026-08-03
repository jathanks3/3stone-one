import type { Metadata } from "next";
import { DocumentsClient } from "@/features/documents/DocumentsClient";
import { RealDocumentsClient } from "@/features/documents/RealDocumentsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listDocuments } from "@/server/services/documentService";
import { db } from "@/server/db";
import { getRecentOneDriveFiles } from "@/server/services/microsoftIntegrationService";
import { getRecentGoogleDriveFiles } from "@/server/services/googleIntegrationService";
import { listCanvasCourseMaterials } from "@/server/services/canvasIntegrationService";

export const metadata: Metadata = { title: "Documents — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const docs = workspaceId ? await listDocuments(workspaceId) : [];
    const microsoft = workspaceId ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "microsoft" } } }) : null;
    const google = workspaceId ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "google" } } }) : null;
    const canvas = workspaceId ? await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } }) : null;
    const oneDriveFiles = workspaceId && microsoft?.status === "connected" ? await getRecentOneDriveFiles(workspaceId).catch(() => null) : [];
    const googleDriveFiles = workspaceId && google?.status === "connected" ? await getRecentGoogleDriveFiles(workspaceId).catch(() => null) : [];
    const canvasMaterials = workspaceId && canvas?.status === "connected" ? await listCanvasCourseMaterials(workspaceId).catch(() => []) : [];
    return (
      <RealDocumentsClient
        initialDocuments={docs}
        oneDriveConnected={microsoft?.status === "connected"}
        oneDriveFiles={oneDriveFiles}
        googleDriveConnected={google?.status === "connected"}
        googleDriveFiles={googleDriveFiles}
        canvasConnected={canvas?.status === "connected"}
        canvasMaterials={canvasMaterials}
      />
    );
  }
  return <DocumentsClient />;
}

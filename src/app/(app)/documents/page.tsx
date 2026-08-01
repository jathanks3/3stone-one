import type { Metadata } from "next";
import { DocumentsClient } from "@/features/documents/DocumentsClient";
import { RealDocumentsClient } from "@/features/documents/RealDocumentsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listDocuments } from "@/server/services/documentService";

export const metadata: Metadata = { title: "Documents — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const docs = workspaceId ? await listDocuments(workspaceId) : [];
    return <RealDocumentsClient initialDocuments={docs} />;
  }
  return <DocumentsClient />;
}

import type { Metadata } from "next";
import { DocumentsClient } from "@/features/documents/DocumentsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Documents — 3Stone One" };

export default async function DocumentsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Documents" />;
  }
  return <DocumentsClient />;
}

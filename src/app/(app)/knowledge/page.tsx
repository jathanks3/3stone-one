import type { Metadata } from "next";
import { KnowledgeClient } from "@/features/knowledge/KnowledgeClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Knowledge Center — 3Stone One" };

export default async function KnowledgePage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Knowledge Center" />;
  }
  return <KnowledgeClient />;
}

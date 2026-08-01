import type { Metadata } from "next";
import { KnowledgeClient } from "@/features/knowledge/KnowledgeClient";
import { RealKnowledgeClient } from "@/features/knowledge/RealKnowledgeClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listKnowledgeArticles } from "@/server/services/knowledgeService";

export const metadata: Metadata = { title: "Knowledge Center — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const articles = workspaceId ? await listKnowledgeArticles(workspaceId) : [];
    return <RealKnowledgeClient initialArticles={articles} />;
  }
  return <KnowledgeClient />;
}

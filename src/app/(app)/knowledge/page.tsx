import type { Metadata } from "next";
import { KnowledgeClient } from "@/features/knowledge/KnowledgeClient";

export const metadata: Metadata = { title: "Knowledge Center — 3Stone One" };

export default function KnowledgePage() {
  return <KnowledgeClient />;
}

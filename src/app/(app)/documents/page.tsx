import type { Metadata } from "next";
import { DocumentsClient } from "@/features/documents/DocumentsClient";

export const metadata: Metadata = { title: "Documents — 3Stone One" };

export default function DocumentsPage() {
  return <DocumentsClient />;
}

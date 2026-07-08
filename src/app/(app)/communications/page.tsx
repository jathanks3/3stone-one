import type { Metadata } from "next";
import { CommunicationsClient } from "@/features/communications/CommunicationsClient";

export const metadata: Metadata = { title: "Communications — 3Stone One" };

export default function CommunicationsPage() {
  return <CommunicationsClient />;
}

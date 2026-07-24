import type { Metadata } from "next";
import { CommunicationsClient } from "@/features/communications/CommunicationsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Communications — 3Stone One" };

export default async function CommunicationsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Communications" />;
  }
  return <CommunicationsClient />;
}

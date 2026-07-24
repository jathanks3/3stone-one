import type { Metadata } from "next";
import { ClientPortalClient } from "@/features/client-portal/ClientPortalClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Client Portal — 3Stone One" };

export default async function ClientPortalPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Client Portal" />;
  }
  return <ClientPortalClient />;
}

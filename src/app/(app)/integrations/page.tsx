import type { Metadata } from "next";
import { IntegrationsClient } from "@/features/integrations/IntegrationsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Integrations — 3Stone One" };

export default async function IntegrationsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Integrations" />;
  }
  return <IntegrationsClient />;
}

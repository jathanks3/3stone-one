import type { Metadata } from "next";
import { IntegrationsClient } from "@/features/integrations/IntegrationsClient";

export const metadata: Metadata = { title: "Integrations — 3Stone One" };

export default function IntegrationsPage() {
  return <IntegrationsClient />;
}

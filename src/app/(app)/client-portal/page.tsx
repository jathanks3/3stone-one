import type { Metadata } from "next";
import { ClientPortalClient } from "@/features/client-portal/ClientPortalClient";

export const metadata: Metadata = { title: "Client Portal — 3Stone One" };

export default function ClientPortalPage() {
  return <ClientPortalClient />;
}

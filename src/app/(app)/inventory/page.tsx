import type { Metadata } from "next";
import { InventoryClient } from "@/features/inventory/InventoryClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Inventory — 3Stone One" };

export default async function InventoryPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Inventory" />;
  }
  return <InventoryClient />;
}

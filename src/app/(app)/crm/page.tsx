import type { Metadata } from "next";
import { CrmClient } from "@/features/crm/CrmClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "CRM — 3Stone One" };

export default async function CrmPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="CRM" />;
  }
  return <CrmClient />;
}

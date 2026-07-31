import type { Metadata } from "next";
import { FinanceClient } from "@/features/finance/FinanceClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Finance — 3Stone One" };

export default async function FinancePage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Finance" />;
  }
  return <FinanceClient />;
}

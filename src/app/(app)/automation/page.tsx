import type { Metadata } from "next";
import { AutomationClient } from "@/features/automation/AutomationClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Automation — 3Stone One" };

export default async function AutomationPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Automation" />;
  }
  return <AutomationClient />;
}

import type { Metadata } from "next";
import { AnalyticsClient } from "@/features/analytics/AnalyticsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Analytics & Reports — 3Stone One" };

export default async function AnalyticsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Analytics & Reports" />;
  }
  return <AnalyticsClient />;
}

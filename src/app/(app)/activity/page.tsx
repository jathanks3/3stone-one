import type { Metadata } from "next";
import { ActivityClient } from "@/features/activity/ActivityClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Activity Log — 3Stone One" };

export default async function ActivityPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Activity Log" />;
  }
  return <ActivityClient />;
}

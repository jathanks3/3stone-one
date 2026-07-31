import type { Metadata } from "next";
import { TimeOffClient } from "@/features/time-off/TimeOffClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Time Off — 3Stone One" };

export default async function TimeOffPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Time Off" />;
  }
  return <TimeOffClient />;
}

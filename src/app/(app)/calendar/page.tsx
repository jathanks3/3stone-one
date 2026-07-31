import type { Metadata } from "next";
import { CalendarClient } from "@/features/calendar/CalendarClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Calendar — 3Stone One" };

export default async function CalendarPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Calendar" />;
  }
  return <CalendarClient />;
}

import type { Metadata } from "next";
import { CalendarClient } from "@/features/calendar/CalendarClient";
import { RealCalendarClient } from "@/features/calendar/RealCalendarClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listAllCalendarEvents } from "@/server/services/calendarService";

export const metadata: Metadata = { title: "Calendar — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const events = workspaceId ? await listAllCalendarEvents(workspaceId) : [];
    return <RealCalendarClient initialEvents={events} />;
  }
  return <CalendarClient />;
}

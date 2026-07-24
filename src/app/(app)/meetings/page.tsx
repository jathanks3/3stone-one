import type { Metadata } from "next";
import { MeetingsClient } from "@/features/meetings/MeetingsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Meetings — 3Stone One" };

export default async function MeetingsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Meetings" />;
  }
  return <MeetingsClient />;
}

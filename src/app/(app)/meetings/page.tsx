import type { Metadata } from "next";
import { MeetingsClient } from "@/features/meetings/MeetingsClient";

export const metadata: Metadata = { title: "Meetings — 3Stone One" };

export default function MeetingsPage() {
  return <MeetingsClient />;
}

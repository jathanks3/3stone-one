import type { Metadata } from "next";
import { ActivityClient } from "@/features/activity/ActivityClient";

export const metadata: Metadata = { title: "Activity Log — 3Stone One" };

export default function ActivityPage() {
  return <ActivityClient />;
}

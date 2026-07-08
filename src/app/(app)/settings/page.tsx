import type { Metadata } from "next";
import { SettingsClient } from "@/features/settings/SettingsClient";

export const metadata: Metadata = { title: "Settings — 3Stone One" };

export default function SettingsPage() {
  return <SettingsClient />;
}

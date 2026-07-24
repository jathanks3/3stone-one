import type { Metadata } from "next";
import { SettingsClient } from "@/features/settings/SettingsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Settings — 3Stone One" };

export default async function SettingsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Settings" />;
  }
  return <SettingsClient />;
}

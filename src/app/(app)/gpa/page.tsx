import type { Metadata } from "next";
import { GpaClient } from "@/features/gpa/GpaClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "GPA Calculator — 3Stone One" };

export default async function GpaPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="GPA Calculator" />;
  }
  return <GpaClient />;
}

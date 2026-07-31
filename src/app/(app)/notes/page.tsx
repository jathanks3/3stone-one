import type { Metadata } from "next";
import { NotesClient } from "@/features/notes/NotesClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Notes — 3Stone One" };

export default async function NotesPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Notes" />;
  }
  return <NotesClient />;
}

import type { Metadata } from "next";
import { NotesClient } from "@/features/notes/NotesClient";
import { RealNotesClient } from "@/features/notes/RealNotesClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listNotes } from "@/server/services/noteService";

export const metadata: Metadata = { title: "Notes — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const notes = workspaceId ? await listNotes(workspaceId) : [];
    return <RealNotesClient initialNotes={notes} />;
  }
  return <NotesClient />;
}

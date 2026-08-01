import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";

export interface NoteRow {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: Date;
}

export async function listNotes(workspaceId: string): Promise<NoteRow[]> {
  return db.note.findMany({
    where: { workspaceId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, body: true, pinned: true, updatedAt: true },
  });
}

export async function createNote(workspaceId: string, authorId: string, title: string, body: string): Promise<NoteRow> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Note title is required.");
  const note = await db.note.create({
    data: { workspaceId, authorId, title: trimmedTitle, body: body.trim() },
  });
  await logActivity(workspaceId, authorId, "created_note", "Note", note.id, { title: trimmedTitle });
  return note;
}

export async function updateNote(workspaceId: string, noteId: string, actorId: string, title: string, body: string): Promise<NoteRow> {
  const existing = await db.note.findFirst({ where: { id: noteId, workspaceId } });
  if (!existing) throw new Error("Note not found.");
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Note title is required.");
  const note = await db.note.update({ where: { id: noteId }, data: { title: trimmedTitle, body: body.trim() } });
  await logActivity(workspaceId, actorId, "updated_note", "Note", noteId, { title: trimmedTitle });
  return note;
}

export async function togglePinNote(workspaceId: string, noteId: string, actorId: string): Promise<NoteRow> {
  const existing = await db.note.findFirst({ where: { id: noteId, workspaceId } });
  if (!existing) throw new Error("Note not found.");
  const note = await db.note.update({ where: { id: noteId }, data: { pinned: !existing.pinned } });
  await logActivity(workspaceId, actorId, note.pinned ? "pinned_note" : "unpinned_note", "Note", noteId);
  return note;
}

export async function deleteNote(workspaceId: string, noteId: string, actorId: string): Promise<void> {
  const existing = await db.note.findFirst({ where: { id: noteId, workspaceId } });
  if (!existing) throw new Error("Note not found.");
  await db.note.delete({ where: { id: noteId } });
  await logActivity(workspaceId, actorId, "deleted_note", "Note", noteId, { title: existing.title });
}

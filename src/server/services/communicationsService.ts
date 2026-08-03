import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";

export interface CallNoteRow {
  id: string;
  contactName: string;
  personId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  authorId: string | null;
  authorName: string | null;
  summary: string;
  occurredAt: Date;
}

export async function listCallNotes(workspaceId: string): Promise<CallNoteRow[]> {
  const notes = await db.callNote.findMany({
    where: { workspaceId },
    orderBy: { occurredAt: "desc" },
    include: { person: { select: { firstName: true, lastName: true } }, organization: { select: { name: true } } },
  });
  const authorIds = [...new Set(notes.map((n) => n.authorId).filter((id): id is string => !!id))];
  const authors = authorIds.length ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(authors.map((a) => [a.id, a.name]));
  return notes.map((n) => ({
    id: n.id,
    contactName: n.person ? `${n.person.firstName} ${n.person.lastName}` : "Unknown",
    personId: n.personId,
    organizationId: n.organizationId,
    organizationName: n.organization?.name ?? null,
    authorId: n.authorId,
    authorName: n.authorId ? nameById.get(n.authorId) ?? "Former member" : null,
    summary: n.summary,
    occurredAt: n.occurredAt,
  }));
}

export async function createCallNote(workspaceId: string, authorId: string, personId: string, summary: string): Promise<CallNoteRow> {
  const person = await db.person.findFirst({ where: { id: personId, workspaceId } });
  if (!person) throw new Error("Select a valid contact for this call note.");
  const trimmed = summary.trim();
  if (!trimmed) throw new Error("Summary is required.");
  const note = await db.callNote.create({ data: { workspaceId, personId, organizationId: person.organizationId, authorId, summary: trimmed } });
  await logActivity(workspaceId, authorId, "logged_call_note", "CallNote", note.id, { contact: `${person.firstName} ${person.lastName}` });
  return { id: note.id, contactName: `${person.firstName} ${person.lastName}`, personId, organizationId: person.organizationId, organizationName: null, authorId, authorName: "You", summary: trimmed, occurredAt: note.occurredAt };
}

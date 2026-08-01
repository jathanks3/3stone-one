import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";

export interface ChatChannelRow {
  id: string;
  name: string;
  isClientChannel: boolean;
}

export interface ChatMessageRow {
  id: string;
  channelId: string;
  authorId: string | null;
  authorName: string;
  body: string;
  createdAt: Date;
}

// Every real workspace starts with one channel so Chat is never an
// empty shell with nothing to post into - matches the "general" channel
// every workspace's demo already shows.
export async function listChannels(workspaceId: string): Promise<ChatChannelRow[]> {
  let channels = await db.chatChannel.findMany({ where: { workspaceId }, orderBy: { id: "asc" } });
  if (channels.length === 0) {
    const general = await db.chatChannel.create({ data: { workspaceId, name: "general" } });
    channels = [general];
  }
  return channels.map((c) => ({ id: c.id, name: c.name, isClientChannel: c.isClientChannel }));
}

export async function createChannel(workspaceId: string, actorId: string, name: string): Promise<ChatChannelRow> {
  const trimmed = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (!trimmed) throw new Error("Channel name is required.");
  const channel = await db.chatChannel.create({ data: { workspaceId, name: trimmed } });
  await logActivity(workspaceId, actorId, "created_channel", "ChatChannel", channel.id, { name: trimmed });
  return { id: channel.id, name: channel.name, isClientChannel: channel.isClientChannel };
}

export async function listMessages(workspaceId: string, channelId: string): Promise<ChatMessageRow[]> {
  const channel = await db.chatChannel.findFirst({ where: { id: channelId, workspaceId } });
  if (!channel) throw new Error("Channel not found.");
  const messages = await db.chatMessage.findMany({ where: { channelId }, orderBy: { createdAt: "asc" } });
  const authorIds = [...new Set(messages.map((m) => m.authorId).filter((id): id is string => !!id))];
  const authors = authorIds.length ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(authors.map((a) => [a.id, a.name]));
  return messages.map((m) => ({
    id: m.id,
    channelId: m.channelId,
    authorId: m.authorId,
    authorName: m.authorId ? nameById.get(m.authorId) ?? "Former member" : "Unknown",
    body: m.body,
    createdAt: m.createdAt,
  }));
}

export async function sendMessage(workspaceId: string, channelId: string, authorId: string, body: string): Promise<ChatMessageRow> {
  const channel = await db.chatChannel.findFirst({ where: { id: channelId, workspaceId } });
  if (!channel) throw new Error("Channel not found.");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message can't be empty.");
  const message = await db.chatMessage.create({ data: { channelId, authorId, body: trimmed } });
  await logActivity(workspaceId, authorId, "sent_chat_message", "ChatMessage", message.id, { channelId });
  return { id: message.id, channelId, authorId, authorName: "You", body: trimmed, createdAt: message.createdAt };
}

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

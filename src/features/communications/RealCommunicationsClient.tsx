"use client";

import { useState, useTransition } from "react";
import { Hash, Mail, MessageSquare, Phone, Plus, Send } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Avatar } from "@/ui/Avatar";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { cn, initialsFromName } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { createCallNoteAction, createChannelAction, sendMessageAction, sendOutlookMailAction, sendSlackMessageAction, sendGmailAction } from "@/app/(app)/communications/actions";
import type { CallNoteRow, ChatChannelRow, ChatMessageRow } from "@/server/services/communicationsService";
import type { PersonRow } from "@/server/services/crmService";
import type { OutlookMessage } from "@/server/services/microsoftIntegrationService";
import type { SlackChannel, SlackMessage } from "@/server/services/slackIntegrationService";
import type { GmailMessage } from "@/server/services/googleIntegrationService";

export function RealCommunicationsClient({
  initialChannels,
  initialMessages,
  initialCallNotes,
  people,
  outlookConnected,
  outlookMessages,
  gmailConnected,
  gmailMessages,
  slackConnected,
  slackChannels,
  slackMessages,
}: {
  initialChannels: ChatChannelRow[];
  initialMessages: ChatMessageRow[];
  initialCallNotes: CallNoteRow[];
  people: PersonRow[];
  outlookConnected: boolean;
  outlookMessages: OutlookMessage[] | null;
  gmailConnected: boolean;
  gmailMessages: GmailMessage[] | null;
  slackConnected: boolean;
  slackChannels: SlackChannel[] | null;
  slackMessages: SlackMessage[] | null;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Communications</h1>
      <p className="mt-1 text-[14px] text-ink-2">Team chat, Outlook email, and call notes — one searchable hub.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "chat", label: "Chat", content: <ChatTab initialChannels={initialChannels} initialMessages={initialMessages} /> },
            { key: "email", label: "Outlook Mail", content: <OutlookMailTab connected={outlookConnected} initialMessages={outlookMessages} /> },
            { key: "gmail", label: "Gmail", content: <GmailTab connected={gmailConnected} messages={gmailMessages} /> },
            { key: "slack", label: "Slack", content: <SlackTab connected={slackConnected} channels={slackChannels} messages={slackMessages} /> },
            { key: "calls", label: "Call Notes", content: <CallNotesTab initial={initialCallNotes} people={people} /> },
          ]}
        />
      </div>
    </div>
  );
}

function GmailTab({ connected, messages }: { connected: boolean; messages: GmailMessage[] | null }) {
  const [composing, setComposing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  if (!connected) return <EmptyState icon={Mail} title="Connect Google to use Gmail" description="Connect Google Workspace from Integrations." />;
  if (messages === null) return <EmptyState icon={Mail} title="Reconnect Google for Gmail access" description="Gmail requires additional Google consent and verification." />;
  function sendEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendGmailAction({}, form);
      if (result.error) return showToast({ title: "Couldn't send Gmail", description: result.error });
      showToast({ title: "Gmail sent" });
      setComposing(false);
    });
  }
  return <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between"><p className="text-[13px] text-ink-2">Your 25 most recent Gmail inbox messages.</p><button onClick={() => setComposing(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent"><Mail size={14} /> Compose</button></div>
    {messages.length === 0 ? <EmptyState icon={Mail} title="Inbox is empty" description="New Gmail messages will appear here." /> : <div className="overflow-hidden rounded-2xl border border-line bg-surface">{messages.map((message) => <div key={message.id} className="border-b border-line px-4 py-3 last:border-b-0"><p className="truncate text-[13.5px] font-semibold text-ink-1">{message.subject}</p><p className="mt-0.5 truncate text-[12px] text-ink-2">{message.from}</p>{message.preview ? <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-3">{message.preview}</p> : null}</div>)}</div>}
    <DetailPanel open={composing} onClose={() => setComposing(false)} title="New Gmail message"><form onSubmit={sendEmail} className="flex flex-col gap-4"><label className="text-[12.5px] font-medium text-ink-2">To<input name="to" type="email" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3" /></label><label className="text-[12.5px] font-medium text-ink-2">Subject<input name="subject" required className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3" /></label><label className="text-[12.5px] font-medium text-ink-2">Message<textarea name="body" required rows={8} className="mt-1 w-full rounded-[9px] border border-line-strong bg-bg px-3 py-2" /></label><button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent">{isPending ? "Sending…" : "Send Gmail"}</button></form></DetailPanel>
  </div>;
}

function SlackTab({ connected, channels, messages }: { connected: boolean; channels: SlackChannel[] | null; messages: SlackMessage[] | null }) {
  const [activeChannel, setActiveChannel] = useState(channels?.[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  if (!connected) return <EmptyState icon={Hash} title="Connect Slack to see channels" description="Install the 3Stone One Slack app from Integrations." />;
  if (!channels || !messages) return <EmptyState icon={Hash} title="Slack needs attention" description="Reconnect Slack or invite the 3Stone One bot to a public channel." />;
  const activeMessages = messages.filter((message) => message.channelId === activeChannel);
  function send() {
    if (!activeChannel || !draft.trim()) return;
    const body = draft.trim();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("channelId", activeChannel);
      fd.set("body", body);
      const result = await sendSlackMessageAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't send to Slack", description: result.error });
      setDraft("");
      showToast({ title: "Slack message sent" });
    });
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
      <div className="rounded-2xl border border-line bg-surface p-1.5">
        {channels.map((channel) => <button key={channel.id} onClick={() => setActiveChannel(channel.id)} className={cn("flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium", activeChannel === channel.id ? "bg-accent-wash text-accent" : "text-ink-2 hover:bg-surface-raised")}><Hash size={14} />{channel.name}</button>)}
      </div>
      <div className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-surface">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {activeMessages.length === 0 ? <p className="text-[13px] text-ink-3">No visible messages in this channel.</p> : activeMessages.map((message) => <div key={message.id}><div className="flex items-baseline gap-2"><span className="text-[12.5px] font-semibold text-ink-1">{message.author}</span><span className="text-[10.5px] text-ink-3">{message.sentAt ? new Date(message.sentAt).toLocaleString() : ""}</span></div><p className="text-[13.5px] text-ink-2">{message.body}</p></div>)}
        </div>
        <div className="flex gap-2 border-t border-line p-3"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message Slack…" className="h-10 flex-1 rounded-[9px] border border-line bg-bg px-3.5 text-[13.5px] outline-none focus:border-accent" /><button onClick={send} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-accent text-on-accent"><Send size={15} /></button></div>
      </div>
    </div>
  );
}

function OutlookMailTab({ connected, initialMessages }: { connected: boolean; initialMessages: OutlookMessage[] | null }) {
  const [composing, setComposing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  if (!connected) {
    return <EmptyState icon={Mail} title="Connect Microsoft to use Outlook Mail" description="Connect Microsoft in Integrations to read and send Outlook email." />;
  }
  if (initialMessages === null) {
    return <EmptyState icon={Mail} title="Reconnect Microsoft for mailbox access" description="Your calendar connection predates Outlook Mail. Reconnect once to approve the new mailbox permissions." />;
  }

  function sendEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendOutlookMailAction({}, form);
      if (result.error) return showToast({ title: "Couldn't send email", description: result.error });
      showToast({ title: "Email sent", description: `Sent to ${String(form.get("to"))}.` });
      setComposing(false);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-2">Your 25 most recent inbox messages.</p>
        <button onClick={() => setComposing(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90">
          <Mail size={14} /> Compose
        </button>
      </div>
      {initialMessages.length === 0 ? (
        <EmptyState icon={Mail} title="Inbox is empty" description="New Outlook messages will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {initialMessages.map((message) => (
            <a key={message.id} href={message.webLink ?? undefined} target="_blank" rel="noreferrer" className="block border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface-raised">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={`truncate text-[13.5px] text-ink-1 ${message.isRead ? "font-medium" : "font-bold"}`}>{message.subject}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-2">{message.senderName}{message.senderAddress ? ` <${message.senderAddress}>` : ""}</p>
                  {message.preview ? <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-3">{message.preview}</p> : null}
                </div>
                <span className="flex-shrink-0 text-[11px] text-ink-3">{message.receivedAt ? new Date(message.receivedAt).toLocaleString() : ""}</span>
              </div>
            </a>
          ))}
        </div>
      )}
      <DetailPanel open={composing} onClose={() => setComposing(false)} title="New Outlook email">
        <form onSubmit={sendEmail} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">To<input name="to" type="email" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" /></label>
          <label className="text-[12.5px] font-medium text-ink-2">Subject<input name="subject" required maxLength={998} className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" /></label>
          <label className="text-[12.5px] font-medium text-ink-2">Message<textarea name="body" required rows={8} className="mt-1 w-full resize-y rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] text-ink-1 outline-none focus:border-accent" /></label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">{isPending ? "Sending…" : "Send email"}</button>
        </form>
      </DetailPanel>
    </div>
  );
}

function ChatTab({ initialChannels, initialMessages }: { initialChannels: ChatChannelRow[]; initialMessages: ChatMessageRow[] }) {
  const [channels, setChannels] = useState(initialChannels);
  const [activeChannel, setActiveChannel] = useState(initialChannels[0]?.id ?? "");
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessageRow[]>>(() => {
    const map: Record<string, ChatMessageRow[]> = {};
    for (const c of initialChannels) map[c.id] = initialMessages.filter((m) => m.channelId === c.id);
    return map;
  });
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const channel = channels.find((c) => c.id === activeChannel);
  const channelMessages = messagesByChannel[activeChannel] ?? [];

  function send() {
    if (!draft.trim() || !channel) return;
    const body = draft.trim();
    setDraft("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("channelId", channel.id);
      fd.set("body", body);
      const result = await sendMessageAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't send message", description: result.error ?? "Something went wrong." });
      setMessagesByChannel((prev) => ({
        ...prev,
        [channel.id]: [...(prev[channel.id] ?? []), { id: result.id!, channelId: channel.id, authorId: null, authorName: "You", body, createdAt: new Date() }],
      }));
    });
  }

  function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", newChannelName.trim());
      const result = await createChannelAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't create channel", description: result.error ?? "Something went wrong." });
      const newChannel = { id: result.id!, name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"), isClientChannel: false };
      setChannels((prev) => [...prev, newChannel]);
      setMessagesByChannel((prev) => ({ ...prev, [newChannel.id]: [] }));
      setActiveChannel(newChannel.id);
      setNewChannelName("");
      setCreating(false);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-1.5">
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChannel(c.id)}
            className={cn(
              "flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium transition-colors",
              activeChannel === c.id ? "bg-accent-wash text-accent" : "text-ink-2 hover:bg-surface-raised"
            )}
          >
            <Hash size={14} />
            <span className="truncate">{c.name}</span>
          </button>
        ))}
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium text-ink-3 hover:bg-surface-raised hover:text-ink-1"
        >
          <Plus size={14} /> New channel
        </button>
      </div>

      <div className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-surface">
        {channel ? (
          <>
            <div className="border-b border-line px-5 py-4">
              <p className="text-[15px] font-semibold text-ink-1">#{channel.name}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {channelMessages.length === 0 ? (
                <p className="text-[13px] text-ink-3">No messages yet — say something.</p>
              ) : (
                channelMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <Avatar initials={initialsFromName(m.authorName)} size={28} />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-ink-1">{m.authorName}</span>
                        <span className="text-[11px] text-ink-3">{new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[13.5px] text-ink-2">{m.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-line p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={`Message #${channel.name}…`}
                className="h-10 flex-1 rounded-[9px] border border-line bg-bg px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
              />
              <button onClick={send} disabled={isPending} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] bg-accent text-on-accent hover:opacity-90" aria-label="Send">
                <Send size={15} />
              </button>
            </div>
          </>
        ) : null}
      </div>

      <DetailPanel open={creating} onClose={() => setCreating(false)} title="New channel">
        <form onSubmit={createChannel} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Name
            <input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} autoFocus placeholder="e.g. project-updates" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">Create</button>
        </form>
      </DetailPanel>
    </div>
  );
}

function CallNotesTab({ initial, people }: { initial: CallNoteRow[]; people: PersonRow[] }) {
  const [notes, setNotes] = useState(initial);
  const [logging, setLogging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function log(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const personId = String(form.get("personId") ?? "");
    const person = people.find((p) => p.id === personId);
    if (!person) return showToast({ title: "Pick a contact first", description: "Add a contact in CRM before logging a call." });
    startTransition(async () => {
      const result = await createCallNoteAction({}, form);
      if (result.error || !result.id) return showToast({ title: "Couldn't log call", description: result.error ?? "Something went wrong." });
      setNotes((prev) => [
        { id: result.id!, contactName: `${person.firstName} ${person.lastName}`, personId, organizationId: person.organizationId, organizationName: person.organizationName, authorId: null, authorName: "You", summary: String(form.get("summary")), occurredAt: new Date() },
        ...prev,
      ]);
      setLogging(false);
    });
  }

  const cols: Column<CallNoteRow>[] = [
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={initialsFromName(c.contactName)} size={26} />
          <span className="font-medium text-ink-1">{c.contactName}</span>
        </div>
      ),
    },
    { key: "summary", header: "Summary", render: (c) => <span className="text-ink-2">{c.summary}</span>, className: "max-w-[420px]" },
    { key: "author", header: "Logged By", render: (c) => c.authorName ?? "—" },
    { key: "at", header: "When", render: (c) => new Date(c.occurredAt).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setLogging(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90">
          <Phone size={14} /> Log a call
        </button>
      </div>
      {notes.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No call notes yet" description="Log your first call to keep a record." />
      ) : (
        <DataTable columns={cols} rows={notes} rowKey={(c) => c.id} />
      )}

      <DetailPanel open={logging} onClose={() => setLogging(false)} title="Log a call">
        <form onSubmit={log} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Contact
            <select name="personId" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent">
              <option value="">Select a contact…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Summary
            <textarea name="summary" rows={4} required className="mt-1 w-full resize-none rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">Log call</button>
        </form>
      </DetailPanel>
    </div>
  );
}

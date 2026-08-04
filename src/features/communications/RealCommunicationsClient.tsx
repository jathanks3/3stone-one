"use client";

import { useState, useTransition } from "react";
import { Hash, MessageSquare, Phone, Send } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Avatar } from "@/ui/Avatar";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { cn, initialsFromName } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { MailTab } from "@/features/communications/MailTab";
import { createCallNoteAction, sendSlackMessageAction } from "@/app/(app)/communications/actions";
import type { CallNoteRow } from "@/server/services/communicationsService";
import type { PersonRow } from "@/server/services/crmService";
import type { OutlookMessage } from "@/server/services/microsoftIntegrationService";
import type { SlackChannel, SlackMessage } from "@/server/services/slackIntegrationService";

// Slack and Call Notes are Workspace/Business-only: Slack channels aren't
// offered to Student in Integrations (integrationCatalog.ts), and Call
// Notes logs against a CRM contact - Student has no CRM module at all
// (editionModules.ts), so there's never a contact to pick. Rather than
// ship a tab that can never work, Student gets Outlook Mail without those two.
export function RealCommunicationsClient({
  editionKey,
  initialCallNotes,
  people,
  outlookConnected,
  outlookMessages,
  slackConnected,
  slackChannels,
  slackMessages,
}: {
  editionKey: string;
  initialCallNotes: CallNoteRow[];
  people: PersonRow[];
  outlookConnected: boolean;
  outlookMessages: OutlookMessage[] | null;
  slackConnected: boolean;
  slackChannels: SlackChannel[] | null;
  slackMessages: SlackMessage[] | null;
}) {
  const isStudent = editionKey === "student";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Communications</h1>
      <p className="mt-1 text-[14px] text-ink-2">
        {isStudent
          ? "Your connected Outlook inbox, read live from Microsoft — nothing here is copied or stored unless you save an attachment."
          : "Outlook email, Slack, and call notes — one searchable hub."}
      </p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "email", label: "Outlook Mail", content: <MailTab provider="microsoft" connected={outlookConnected} messages={outlookMessages} /> },
            ...(isStudent
              ? []
              : [
                  { key: "slack", label: "Slack", content: <SlackTab connected={slackConnected} channels={slackChannels} messages={slackMessages} /> },
                  { key: "calls", label: "Call Notes", content: <CallNotesTab initial={initialCallNotes} people={people} /> },
                ]),
          ]}
        />
      </div>
    </div>
  );
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

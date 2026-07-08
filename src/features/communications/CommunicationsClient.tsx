"use client";

import { useState } from "react";
import { Hash, Send, Users } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Avatar } from "@/ui/Avatar";
import { DataTable, type Column } from "@/ui/DataTable";
import { cn, initialsFromName } from "@/lib/utils";
import {
  DEMO_CALL_NOTES,
  DEMO_CHAT_CHANNELS,
  DEMO_CHAT_MESSAGES,
  DEMO_EMAIL_THREADS,
  getEmployeeName,
} from "@/server/mock-data";
import type { CallNote, ChatMessage, EmailThread } from "@/types";

export function CommunicationsClient() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Communications</h1>
      <p className="mt-1 text-[14px] text-ink-2">Email, internal chat, and call notes — one searchable hub.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "inbox", label: "Inbox", content: <InboxTab /> },
            { key: "chat", label: "Chat", content: <ChatTab /> },
            { key: "calls", label: "Call Notes", content: <CallNotesTab /> },
          ]}
        />
      </div>
    </div>
  );
}

function InboxTab() {
  const [threads, setThreads] = useState<EmailThread[]>(DEMO_EMAIL_THREADS);
  const [activeId, setActiveId] = useState(threads[0]?.id);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  function send() {
    if (!draft.trim() || !active) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, unread: false, messages: [...t.messages, { id: `m_${Date.now()}`, from: "You", body: draft, at: "Just now" }] }
          : t
      )
    );
    setDraft("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-1 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 md:max-h-[520px] md:overflow-y-auto">
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveId(t.id);
              setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, unread: false } : x)));
            }}
            className={cn(
              "flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5 text-left transition-colors",
              active?.id === t.id ? "bg-accent-wash" : "hover:bg-surface-raised"
            )}
          >
            <div className="flex items-center gap-1.5">
              {t.unread ? <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-accent" /> : null}
              <span className={cn("truncate text-[13px]", t.unread ? "font-semibold text-ink-1" : "font-medium text-ink-2")}>
                {t.subject}
              </span>
            </div>
            <span className="truncate text-[12px] text-ink-3">{t.participant}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-surface">
        {active ? (
          <>
            <div className="border-b border-line px-5 py-4">
              <p className="text-[15px] font-semibold text-ink-1">{active.subject}</p>
              <p className="text-[12.5px] text-ink-3">with {active.participant}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex flex-col gap-1", m.from === "You" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-[12px] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                      m.from === "You" ? "bg-accent text-on-accent" : "bg-surface-raised text-ink-1"
                    )}
                  >
                    {m.body}
                  </div>
                  <span className="text-[11px] text-ink-3">{m.from} · {m.at}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-line p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Write a reply…"
                className="h-10 flex-1 rounded-[9px] border border-line bg-bg px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
              />
              <button
                onClick={send}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] bg-accent text-on-accent hover:opacity-90"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_CHAT_MESSAGES);
  const [activeChannel, setActiveChannel] = useState(DEMO_CHAT_CHANNELS[0].id);
  const [draft, setDraft] = useState("");
  const channel = DEMO_CHAT_CHANNELS.find((c) => c.id === activeChannel)!;
  const channelMessages = messages.filter((m) => m.channelId === activeChannel);

  function send() {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `cm_${Date.now()}`, channelId: activeChannel, author: "You", authorInitials: "AR", body: draft, at: "Just now" },
    ]);
    setDraft("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-1.5">
        {DEMO_CHAT_CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChannel(c.id)}
            className={cn(
              "flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] font-medium transition-colors",
              activeChannel === c.id ? "bg-accent-wash text-accent" : "text-ink-2 hover:bg-surface-raised"
            )}
          >
            {c.isClientChannel ? <Users size={14} /> : <Hash size={14} />}
            <span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[15px] font-semibold text-ink-1">
            {channel.isClientChannel ? channel.name : `#${channel.name}`}
          </p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {channelMessages.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5">
              <Avatar initials={m.authorInitials} size={28} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-ink-1">{m.author}</span>
                  <span className="text-[11px] text-ink-3">{m.at}</span>
                </div>
                <p className="text-[13.5px] text-ink-2">{m.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message ${channel.isClientChannel ? channel.name : "#" + channel.name}…`}
            className="h-10 flex-1 rounded-[9px] border border-line bg-bg px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
          />
          <button
            onClick={send}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] bg-accent text-on-accent hover:opacity-90"
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CallNotesTab() {
  const cols: Column<CallNote>[] = [
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
    { key: "author", header: "Logged By", render: (c) => getEmployeeName(c.authorId) },
    { key: "at", header: "When", render: (c) => c.at },
  ];

  return <DataTable columns={cols} rows={DEMO_CALL_NOTES} rowKey={(c) => c.id} />;
}

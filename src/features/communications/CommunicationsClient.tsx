"use client";

import { useState } from "react";
import { Mail, Reply, Send } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Avatar } from "@/ui/Avatar";
import { DataTable, type Column } from "@/ui/DataTable";
import { cn, initialsFromName } from "@/lib/utils";
import { useIndustry } from "@/lib/industry";
import {
  DEMO_CALL_NOTES,
  DEMO_EMAIL_THREADS,
  STUDENT_EMAIL_THREADS,
  WORKSPACE_CALL_NOTES,
  WORKSPACE_EMAIL_THREADS,
  WORKSPACE_EMPLOYEES,
  getEmployeeName,
} from "@/server/mock-data";
import type { CallNote, EmailThread } from "@/types";

function callAuthorName(id: string): string {
  return WORKSPACE_EMPLOYEES.find((e) => e.id === id)?.name ?? getEmployeeName(id);
}

export function CommunicationsClient() {
  const { editionKey } = useIndustry();
  const isWorkspace = editionKey === "workspace";
  const isStudent = editionKey === "student";
  const emailThreads = isStudent ? STUDENT_EMAIL_THREADS : isWorkspace ? WORKSPACE_EMAIL_THREADS : DEMO_EMAIL_THREADS;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Communications</h1>
      <p className="mt-1 text-[14px] text-ink-2">Email and call notes — one searchable hub.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "inbox", label: "Inbox", content: <InboxTab seed={emailThreads} /> },
            ...(isStudent ? [] : [{ key: "calls", label: "Call Notes", content: <CallNotesTab rows={isWorkspace ? WORKSPACE_CALL_NOTES : DEMO_CALL_NOTES} /> }]),
          ]}
        />
      </div>
    </div>
  );
}

function InboxTab({ seed }: { seed: EmailThread[] }) {
  const [threads, setThreads] = useState<EmailThread[]>(seed);
  const [activeId, setActiveId] = useState(threads[0]?.id);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.id === activeId) ?? threads[0];
  const displayedMessage = active?.messages[active.messages.length - 1];

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
            {displayedMessage ? (
              <article className="flex flex-1 flex-col overflow-hidden">
                <header className="border-b border-line px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-accent-wash text-accent"><Mail size={17} /></span>
                      <div className="min-w-0">
                        <h2 className="truncate text-[16px] font-semibold text-ink-1">{active.subject}</h2>
                        <p className="mt-0.5 truncate text-[12px] text-ink-3">{displayedMessage.from}</p>
                      </div>
                    </div>
                    <time className="flex-shrink-0 pt-1 text-[11px] text-ink-3">{displayedMessage.at}</time>
                  </div>
                  <dl className="mt-4 grid grid-cols-[52px_1fr] gap-x-2 gap-y-1 border-t border-line pt-3 text-[12px]">
                    <dt className="text-ink-3">From</dt><dd className="font-medium text-ink-1">{displayedMessage.from}</dd>
                    <dt className="text-ink-3">To</dt><dd className="text-ink-2">{displayedMessage.from === "You" ? active.participant : "You"}</dd>
                    <dt className="text-ink-3">Subject</dt><dd className="text-ink-2">{active.subject}</dd>
                  </dl>
                </header>
                <div className="flex-1 overflow-y-auto px-6 py-7">
                  <p className="max-w-3xl whitespace-pre-wrap text-[14px] leading-7 text-ink-1">{displayedMessage.body}</p>
                </div>
              </article>
            ) : null}
            <div className="border-t border-line bg-surface-raised/40 p-4">
              <div className="rounded-[10px] border border-line bg-bg p-3 focus-within:border-accent">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-ink-2"><Reply size={13} />Reply to {active.participant}</div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write your email reply…"
                  rows={4}
                  className="w-full resize-y bg-transparent text-[13.5px] leading-6 text-ink-1 outline-none placeholder:text-ink-3"
                />
                <div className="mt-2 flex justify-end">
                <button
                  onClick={send}
                  className="flex h-9 items-center gap-2 rounded-[9px] bg-accent px-4 text-[12px] font-semibold text-on-accent hover:opacity-90"
                  aria-label="Send"
                >
                  <Send size={14} /> Send email
                </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CallNotesTab({ rows }: { rows: CallNote[] }) {
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
    { key: "author", header: "Logged By", render: (c) => callAuthorName(c.authorId) },
    { key: "at", header: "When", render: (c) => c.at },
  ];

  return <DataTable columns={cols} rows={rows} rowKey={(c) => c.id} />;
}

"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
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
            <div className="flex-1 space-y-3 overflow-y-auto bg-bg/40 p-5">
              {active.messages.map((m) => (
                <article key={m.id} className="overflow-hidden rounded-[12px] border border-line bg-surface shadow-sm">
                  <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-accent-wash text-accent">
                        <Mail size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink-1">{m.from}</p>
                        <p className="truncate text-[11px] text-ink-3">to {m.from === "You" ? active.participant : "You"}</p>
                      </div>
                    </div>
                    <time className="flex-shrink-0 pt-0.5 text-[11px] text-ink-3">{m.at}</time>
                  </header>
                  <div className="whitespace-pre-wrap px-4 py-4 text-[13.5px] leading-6 text-ink-1">
                    {m.body}
                  </div>
                </article>
              ))}
            </div>
            <div className="border-t border-line p-3">
              <div className="flex items-center gap-2 rounded-[10px] border border-line bg-bg p-2 focus-within:border-accent">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={`Reply to ${active.participant}…`}
                  className="h-9 flex-1 bg-transparent px-2 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3"
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

"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Avatar } from "@/ui/Avatar";
import { DataTable, type Column } from "@/ui/DataTable";
import { cn, initialsFromName } from "@/lib/utils";
import { useIndustry } from "@/lib/industry";
import {
  DEMO_CALL_NOTES,
  DEMO_EMAIL_THREADS,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Communications</h1>
      <p className="mt-1 text-[14px] text-ink-2">Email and call notes — one searchable hub.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "inbox", label: "Inbox", content: <InboxTab seed={isWorkspace ? WORKSPACE_EMAIL_THREADS : DEMO_EMAIL_THREADS} /> },
            { key: "calls", label: "Call Notes", content: <CallNotesTab rows={isWorkspace ? WORKSPACE_CALL_NOTES : DEMO_CALL_NOTES} /> },
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

"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle, Paperclip, Send } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { askAssistant } from "@/lib/assistantBus";
import { loadMessageDetailAction, saveAttachmentAction, sendReplyAction } from "@/app/(app)/emails/actions";
import type { InboxProvider, InboxMessageDetail } from "@/server/services/inboxService";
import type { GmailMessage } from "@/server/services/googleIntegrationService";
import type { OutlookMessage } from "@/server/services/microsoftIntegrationService";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

// Gmail only gives us a raw "Name <email@x.com>" header string, not a
// separate address field the way Outlook does (senderAddress) - this is
// what a reply's "to" is actually sent to.
function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw;
}

// Same two-pane "list on the left, thread on the right" shape as
// Communications' demo Inbox tab (CommunicationsClient.tsx's InboxTab) -
// this is what makes the real Emails module read as the same product the
// Workspace demo shows, instead of the flatter row-list-plus-slide-over
// it used to be. Gmail and Outlook stay on separate tabs (unlike the
// demo's single merged mock inbox) because they're two real, independently
// connected accounts, not one seeded dataset.
export function RealEmailsClient({
  gmailConnected,
  gmailMessages,
  outlookConnected,
  outlookMessages,
}: {
  gmailConnected: boolean;
  gmailMessages: GmailMessage[] | null;
  outlookConnected: boolean;
  outlookMessages: OutlookMessage[] | null;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Emails</h1>
      <p className="mt-1 text-[14px] text-ink-2">Your connected inbox, read live from Gmail and Outlook - nothing here is copied or stored unless you save an attachment.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "gmail", label: "Gmail", content: <ProviderInboxTab provider="google" connected={gmailConnected} messages={gmailMessages} /> },
            { key: "outlook", label: "Outlook Mail", content: <ProviderInboxTab provider="microsoft" connected={outlookConnected} messages={outlookMessages} /> },
          ]}
        />
      </div>
    </div>
  );
}

interface Row {
  id: string;
  subject: string;
  from: string;
  to: string;
  receivedAt: string;
  preview: string;
  unread: boolean;
}

function toRow(provider: InboxProvider, message: GmailMessage | OutlookMessage): Row {
  if (provider === "google") {
    const m = message as GmailMessage;
    return { id: m.id, subject: m.subject, from: m.from, to: extractEmailAddress(m.from), receivedAt: m.receivedAt, preview: m.preview, unread: false };
  }
  const m = message as OutlookMessage;
  return { id: m.id, subject: m.subject, from: m.senderName || m.senderAddress, to: m.senderAddress, receivedAt: m.receivedAt, preview: m.preview, unread: !m.isRead };
}

function ProviderInboxTab({
  provider,
  connected,
  messages,
}: {
  provider: InboxProvider;
  connected: boolean;
  messages: (GmailMessage | OutlookMessage)[] | null;
}) {
  const providerName = provider === "google" ? "Gmail" : "Outlook";
  const rows = messages?.map((m) => toRow(provider, m)) ?? [];
  const [activeId, setActiveId] = useState(rows[0]?.id);
  const [detail, setDetail] = useState<InboxMessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingAttachmentId, setSavingAttachmentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const active = rows.find((r) => r.id === activeId) ?? rows[0];

  if (!connected) {
    return (
      <EmptyState
        icon={Mail}
        title={`Connect ${provider === "google" ? "Google" : "Microsoft"} to use ${providerName}`}
        description={`Connect ${provider === "google" ? "Google" : "Microsoft"} in Integrations to read your ${providerName} inbox here.`}
      />
    );
  }
  if (messages === null) {
    return (
      <EmptyState
        icon={Mail}
        title={`Reconnect ${provider === "google" ? "Google" : "Microsoft"} for ${providerName} access`}
        description="Your connection predates email access - reconnect once in Integrations to approve it."
      />
    );
  }
  if (rows.length === 0) {
    return <EmptyState icon={Mail} title="Inbox is empty" description={`New ${providerName} messages will appear here.`} />;
  }

  function openMessage(row: Row) {
    setActiveId(row.id);
    setDetail(null);
    setLoadingDetail(true);
    startTransition(async () => {
      const form = new FormData();
      form.set("provider", provider);
      form.set("messageId", row.id);
      const result = await loadMessageDetailAction({}, form);
      setLoadingDetail(false);
      if (result.error || !result.detail) {
        showToast({ title: "Couldn't load this email", description: result.error });
        return;
      }
      setDetail(result.detail);
    });
  }

  function saveAttachment(a: { id: string; filename: string; mimeType: string }) {
    if (!active) return;
    setSavingAttachmentId(a.id);
    startTransition(async () => {
      const form = new FormData();
      form.set("provider", provider);
      form.set("messageId", active.id);
      form.set("attachmentId", a.id);
      form.set("filename", a.filename);
      form.set("mimeType", a.mimeType);
      const result = await saveAttachmentAction({}, form);
      setSavingAttachmentId(null);
      if (result.error) return showToast({ title: "Couldn't save attachment", description: result.error });
      showToast({ title: result.success ?? "Saved to Documents" });
    });
  }

  function sendReply() {
    if (!active || !draft.trim()) return;
    const body = draft.trim();
    startTransition(async () => {
      const form = new FormData();
      form.set("provider", provider);
      form.set("to", active.to);
      form.set("subject", active.subject.startsWith("Re:") ? active.subject : `Re: ${active.subject}`);
      form.set("body", body);
      const result = await sendReplyAction({}, form);
      if (result.error) return showToast({ title: "Couldn't send reply", description: result.error });
      setDraft("");
      showToast({ title: "Reply sent" });
    });
  }

  function askAiAboutThis() {
    if (!active) return;
    askAssistant(`Help me with this email - "${active.subject}" from ${active.from}: ${detail?.bodyText?.slice(0, 500) ?? ""}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-ink-2">Your 25 most recent {providerName} inbox messages.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-1 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 md:max-h-[520px] md:overflow-y-auto">
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => openMessage(row)}
              className={cn(
                "flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5 text-left transition-colors",
                active?.id === row.id ? "bg-accent-wash" : "hover:bg-surface-raised"
              )}
            >
              <div className="flex items-center gap-1.5">
                {row.unread ? <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-accent" /> : null}
                <span className={cn("truncate text-[13px]", row.unread ? "font-semibold text-ink-1" : "font-medium text-ink-2")}>
                  {row.subject}
                </span>
              </div>
              <span className="truncate text-[12px] text-ink-3">{row.from}</span>
            </button>
          ))}
        </div>

        <div className="flex min-h-[420px] flex-col rounded-2xl border border-line bg-surface">
          {active ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink-1">{active.subject}</p>
                  <p className="truncate text-[12.5px] text-ink-3">with {active.from}</p>
                </div>
                <span className="flex-shrink-0 text-[11px] text-ink-3">{fmtDate(active.receivedAt)}</span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {loadingDetail ? (
                  <p className="text-[13.5px] text-ink-3">Loading…</p>
                ) : detail ? (
                  <>
                    <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-1">{detail.bodyText || "(no body text)"}</p>

                    <Button variant="secondary" onClick={askAiAboutThis} className="w-fit">
                      <MessageCircle size={14} /> Ask AI about this
                    </Button>

                    {detail.attachments.length > 0 ? (
                      <div>
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attachments</p>
                        <div className="flex flex-col gap-2">
                          {detail.attachments.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-bg px-3.5 py-2.5">
                              <div className="flex min-w-0 items-center gap-2">
                                <Paperclip size={14} className="flex-shrink-0 text-ink-3" />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium text-ink-1">{a.filename}</p>
                                  <p className="text-[11.5px] text-ink-3">{formatSize(a.sizeBytes)}</p>
                                </div>
                              </div>
                              <Button
                                variant="secondary"
                                disabled={isPending && savingAttachmentId === a.id}
                                onClick={() => saveAttachment(a)}
                              >
                                {isPending && savingAttachmentId === a.id ? "Saving…" : "Save to Documents"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="line-clamp-3 text-[13px] text-ink-3">{active.preview}</p>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-line p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Write a reply…"
                  className="h-10 flex-1 rounded-[9px] border border-line bg-bg px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
                />
                <button
                  onClick={sendReply}
                  disabled={isPending || !draft.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[9px] bg-accent text-on-accent hover:opacity-90 disabled:opacity-60"
                  aria-label="Send"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Link as LinkIcon, Mail, MessageCircle, NotebookPen, Paperclip, Send } from "lucide-react";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { DetailPanel } from "@/ui/DetailPanel";
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

function previewable(mimeType: string): "image" | "audio" | "video" | "iframe" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "iframe";
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

// The one real Gmail/Outlook inbox experience shared by both the Emails
// module (Student, and Business's unrestricted nav) and Communications'
// Outlook Mail/Gmail tabs (Workspace/Business) - same two-pane list/thread
// layout as Communications' demo Inbox tab, plus real reply, real
// attachment "Save to Documents", real inline preview for image/PDF
// attachments (same DetailPanel + iframe pattern Documents uses for its
// own OneDrive/Drive/Canvas file previews - see RealDocumentsClient.tsx),
// and "Ask AI about this". One implementation instead of two so a fix or
// a new capability here shows up in both modules at once.
export function MailTab({
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
  const [composing, setComposing] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ filename: string; url: string; kind: "image" | "audio" | "video" | "iframe" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const active = rows.find((r) => r.id === activeId) ?? rows[0];

  function sendCompose(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("provider", provider);
    startTransition(async () => {
      const result = await sendReplyAction({}, form);
      if (result.error) return showToast({ title: "Couldn't send", description: result.error });
      showToast({ title: `${providerName} message sent` });
      setComposing(false);
    });
  }

  const composePanel = (
    <DetailPanel open={composing} onClose={() => setComposing(false)} title={`New ${providerName} message`}>
      <form onSubmit={sendCompose} className="flex flex-col gap-4">
        <label className="text-[12.5px] font-medium text-ink-2">
          To
          <input name="to" type="email" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
        </label>
        <label className="text-[12.5px] font-medium text-ink-2">
          Subject
          <input name="subject" required className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
        </label>
        <label className="text-[12.5px] font-medium text-ink-2">
          Message
          <textarea name="body" required rows={8} className="mt-1 w-full resize-y rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] text-ink-1 outline-none focus:border-accent" />
        </label>
        <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
          {isPending ? "Sending…" : "Send"}
        </button>
      </form>
    </DetailPanel>
  );

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
      const destination = a.mimeType.startsWith("image/") || a.mimeType.startsWith("audio/") || a.mimeType.startsWith("video/") ? "Knowledge Center" : "Documents";
      showToast({ title: `Saved to ${destination}` });
    });
  }

  function previewAttachmentFile(a: { id: string; filename: string; mimeType: string }) {
    if (!active) return;
    const kind = previewable(a.mimeType);
    const url = `/api/inbox/attachment?${new URLSearchParams({
      provider,
      messageId: active.id,
      attachmentId: a.id,
      mimeType: a.mimeType,
      filename: a.filename,
    }).toString()}`;
    setPreviewAttachment({ filename: a.filename, url, kind });
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

  function askToAddToCalendar() {
    if (!active) return;
    askAssistant(`Review this email and help me add any real date or meeting it contains to Calendar: "${active.subject}" from ${active.from}. Email text: ${detail?.bodyText?.slice(0, 1200) ?? active.preview}. Do not guess a missing date or time; ask me for it.`);
  }

  function askToMakeNotes() {
    if (!active) return;
    askAssistant(`Help me make a note from this email: "${active.subject}" from ${active.from}. Email text: ${detail?.bodyText?.slice(0, 1200) ?? active.preview}. Suggest a concise title and capture decisions, follow-ups, and anything I should remember, then ask before saving.`);
  }

  if (rows.length === 0) {
    return (
      <>
        <EmptyState
          icon={Mail}
          title="Inbox is empty"
          description={`New ${providerName} messages will appear here.`}
          action={
            <button onClick={() => setComposing(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90">
              <Mail size={14} /> Compose
            </button>
          }
        />
        {composePanel}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-2">Your 25 most recent {providerName} inbox messages.</p>
        <button onClick={() => setComposing(true)} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90">
          <Mail size={14} /> Compose
        </button>
      </div>
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
                    {detail.bodyHtml ? (
                      <div className="email-body max-w-none overflow-x-auto text-[13.5px] leading-relaxed text-ink-1 [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_table]:max-w-full" dangerouslySetInnerHTML={{ __html: detail.bodyHtml }} />
                    ) : <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-1">{detail.bodyText || "(no body text)"}</p>}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={askAiAboutThis}><MessageCircle size={14} /> Ask AI</Button>
                      <Button variant="secondary" onClick={askToAddToCalendar}><CalendarPlus size={14} /> Add date to Calendar</Button>
                      <Button variant="secondary" onClick={askToMakeNotes}><NotebookPen size={14} /> Make notes</Button>
                    </div>

                    {detail.attachments.length > 0 ? (
                      <div>
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attachments</p>
                        <div className="flex flex-col gap-2">
                          {detail.attachments.map((a) =>
                            a.kind === "link" ? (
                              <button
                                key={a.id}
                                onClick={() => a.url && setPreviewAttachment({ filename: a.filename, url: a.url, kind: "iframe" })}
                                className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-bg px-3.5 py-2.5 hover:bg-surface-raised"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <LinkIcon size={14} className="flex-shrink-0 text-ink-3" />
                                  <p className="truncate text-[13px] font-medium text-ink-1">{a.filename}</p>
                                </div>
                                <span className="flex-shrink-0 text-[12.5px] font-semibold text-accent">Preview</span>
                              </button>
                            ) : (
                              <div key={a.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-bg px-3.5 py-2.5">
                                <div className="flex min-w-0 items-center gap-2">
                                  <Paperclip size={14} className="flex-shrink-0 text-ink-3" />
                                  <div className="min-w-0">
                                    <p className="truncate text-[13px] font-medium text-ink-1">{a.filename}</p>
                                    <p className="text-[11.5px] text-ink-3">{formatSize(a.sizeBytes)}</p>
                                  </div>
                                </div>
                                <div className="flex flex-shrink-0 gap-2">
                                  <Button variant="secondary" onClick={() => previewAttachmentFile(a)}>Preview</Button>
                                  <Button
                                    variant="secondary"
                                    disabled={isPending && savingAttachmentId === a.id}
                                    onClick={() => saveAttachment(a)}
                                  >
                                    {isPending && savingAttachmentId === a.id ? "Saving…" : a.mimeType.startsWith("image/") || a.mimeType.startsWith("audio/") || a.mimeType.startsWith("video/") ? "Save to Knowledge" : "Save to Documents"}
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
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
      {composePanel}

      <DetailPanel open={!!previewAttachment} onClose={() => setPreviewAttachment(null)} title={previewAttachment?.filename ?? ""}>
        {previewAttachment ? (
          previewAttachment.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewAttachment.url} alt={previewAttachment.filename} className="w-full rounded-[10px] border border-line" />
          ) : previewAttachment.kind === "audio" ? (
            <audio controls src={previewAttachment.url} className="w-full" />
          ) : previewAttachment.kind === "video" ? (
            <video controls src={previewAttachment.url} className="max-h-[70vh] w-full rounded-[10px] border border-line" />
          ) : (
            <iframe src={previewAttachment.url} title={previewAttachment.filename} className="h-[70vh] w-full rounded-[10px] border border-line" />
          )
        ) : null}
      </DetailPanel>
    </div>
  );
}

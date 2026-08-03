"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle, Paperclip } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import { askAssistant } from "@/lib/assistantBus";
import { loadMessageDetailAction, saveAttachmentAction } from "@/app/(app)/emails/actions";
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

interface OpenMessage {
  provider: InboxProvider;
  id: string;
  subject: string;
  from: string;
}

// Same per-provider-tab shape as Communications' Gmail/Outlook Mail tabs
// (RealCommunicationsClient.tsx) - same row list style, same "reconnect
// for access" empty state - so this reads as the same product, not a
// bespoke one-off just because it's Student edition.
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
  const [open, setOpen] = useState<OpenMessage | null>(null);
  const [detail, setDetail] = useState<InboxMessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingAttachmentId, setSavingAttachmentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function openMessage(message: OpenMessage) {
    setOpen(message);
    setDetail(null);
    setLoadingDetail(true);
    startTransition(async () => {
      const form = new FormData();
      form.set("provider", message.provider);
      form.set("messageId", message.id);
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
    if (!open) return;
    setSavingAttachmentId(a.id);
    startTransition(async () => {
      const form = new FormData();
      form.set("provider", open.provider);
      form.set("messageId", open.id);
      form.set("attachmentId", a.id);
      form.set("filename", a.filename);
      form.set("mimeType", a.mimeType);
      const result = await saveAttachmentAction({}, form);
      setSavingAttachmentId(null);
      if (result.error) {
        showToast({ title: "Couldn't save attachment", description: result.error });
        return;
      }
      showToast({ title: result.success ?? "Saved to Documents" });
    });
  }

  function askAiAboutThis() {
    if (!open) return;
    askAssistant(`Help me with this email - "${open.subject}" from ${open.from}: ${detail?.bodyText?.slice(0, 500) ?? ""}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Emails</h1>
      <p className="mt-1 text-[14px] text-ink-2">Your connected inbox, read live from Gmail and Outlook - nothing here is copied or stored unless you save an attachment.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "gmail", label: "Gmail", content: <MessageListTab provider="google" connected={gmailConnected} messages={gmailMessages} onOpen={openMessage} /> },
            { key: "outlook", label: "Outlook Mail", content: <MessageListTab provider="microsoft" connected={outlookConnected} messages={outlookMessages} onOpen={openMessage} /> },
          ]}
        />
      </div>

      <DetailPanel open={!!open} onClose={() => setOpen(null)} title={open?.subject ?? ""} subtitle={open?.from ?? ""}>
        {loadingDetail ? (
          <p className="text-[13.5px] text-ink-3">Loading…</p>
        ) : detail ? (
          <div className="flex flex-col gap-5">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-1">{detail.bodyText || "(no body text)"}</p>

            <Button variant="secondary" onClick={askAiAboutThis} className="w-fit">
              <MessageCircle size={14} /> Ask AI about this
            </Button>

            {detail.attachments.length > 0 ? (
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attachments</p>
                <div className="flex flex-col gap-2">
                  {detail.attachments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-2.5">
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
          </div>
        ) : null}
      </DetailPanel>
    </div>
  );
}

function MessageListTab({
  provider,
  connected,
  messages,
  onOpen,
}: {
  provider: InboxProvider;
  connected: boolean;
  messages: (GmailMessage | OutlookMessage)[] | null;
  onOpen: (message: OpenMessage) => void;
}) {
  const providerName = provider === "google" ? "Gmail" : "Outlook";

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
  if (messages.length === 0) {
    return <EmptyState icon={Mail} title="Inbox is empty" description={`New ${providerName} messages will appear here.`} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-ink-2">Your 25 most recent {providerName} inbox messages.</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {messages.map((message) => {
          const from = "from" in message ? message.from : message.senderName;
          return (
            <button
              key={message.id}
              onClick={() => onOpen({ provider, id: message.id, subject: message.subject, from })}
              className="block w-full border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-surface-raised"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink-1">{message.subject}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-2">{from}</p>
                  {message.preview ? <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-3">{message.preview}</p> : null}
                </div>
                <span className="flex-shrink-0 text-[11px] text-ink-3">{fmtDate(message.receivedAt)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

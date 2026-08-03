"use client";

import { useState, useTransition } from "react";
import { Mail, Paperclip, Plug } from "lucide-react";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import { loadMessageDetailAction, saveAttachmentAction } from "@/app/(app)/emails/actions";
import type { InboxMessageRow, InboxMessageDetail, ConnectedInboxProviders } from "@/server/services/inboxService";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function RealEmailsClient({
  initialMessages,
  connected,
}: {
  initialMessages: InboxMessageRow[];
  connected: ConnectedInboxProviders;
}) {
  const [selected, setSelected] = useState<InboxMessageRow | null>(null);
  const [detail, setDetail] = useState<InboxMessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingAttachmentId, setSavingAttachmentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const isConnected = connected.google || connected.microsoft;

  function openMessage(message: InboxMessageRow) {
    setSelected(message);
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
    if (!selected) return;
    setSavingAttachmentId(a.id);
    startTransition(async () => {
      const form = new FormData();
      form.set("provider", selected.provider);
      form.set("messageId", selected.id);
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

  const columns: Column<InboxMessageRow>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Mail size={16} className="flex-shrink-0 text-ink-3" />
          <span className="truncate font-medium text-ink-1">{m.subject}</span>
        </div>
      ),
    },
    { key: "from", header: "From", render: (m) => m.from },
    { key: "receivedAt", header: "Received", render: (m) => fmtDate(m.receivedAt) },
    { key: "provider", header: "Account", render: (m) => (m.provider === "google" ? "Gmail" : "Outlook") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Emails</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            Your connected inbox, read live from Gmail or Outlook - nothing here is copied or stored unless you save an attachment.
          </p>
        </div>
      </div>

      <div className="mt-6">
        {!isConnected ? (
          <EmptyState
            icon={Plug}
            title="No email account connected"
            description="Connect Google or Microsoft in Integrations to see your inbox here."
            action={
              <Button variant="primary" onClick={() => (window.location.href = "/integrations")}>
                Go to Integrations
              </Button>
            }
          />
        ) : initialMessages.length === 0 ? (
          <EmptyState icon={Mail} title="No recent emails" description="Your inbox is empty, or nothing new has come in yet." />
        ) : (
          <DataTable columns={columns} rows={initialMessages} rowKey={(m) => `${m.provider}:${m.id}`} onRowClick={openMessage} />
        )}
      </div>

      <DetailPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.subject ?? ""} subtitle={selected?.from ?? ""}>
        {loadingDetail ? (
          <p className="text-[13.5px] text-ink-3">Loading…</p>
        ) : detail ? (
          <div className="flex flex-col gap-5">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-1">{detail.bodyText || "(no body text)"}</p>
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

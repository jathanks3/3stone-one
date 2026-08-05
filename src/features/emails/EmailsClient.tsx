"use client";

import { useState } from "react";
import { MessageCircle, Paperclip } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { DetailPanel } from "@/ui/DetailPanel";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import { askAssistant } from "@/lib/assistantBus";

interface DemoEmail {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  preview: string;
  body: string;
  attachment?: { filename: string; sizeLabel: string };
}

const GMAIL_DEMO: DemoEmail[] = [
  {
    id: "g1",
    subject: "Group project - meeting moved to Thursday 4pm",
    from: "Priya Nair",
    receivedAt: "Yesterday, 6:41 PM",
    preview: "Hey, quick change - the study group is moving to Thursday at 4pm in the library instead of Wednesday...",
    body: "Hey, quick change - the study group is moving to Thursday at 4pm in the library instead of Wednesday. Same room. Bring your notes on chapter 6, we're splitting up the summary.",
  },
  {
    id: "g2",
    subject: "Internship offer - next steps",
    from: "Recruiting, Northline Analytics",
    receivedAt: "Last week",
    preview: "Congratulations again! Attached is your offer letter - please review and sign by Friday...",
    body: "Congratulations again! Attached is your offer letter - please review and sign by Friday. Reach out if you have any questions about start date or onboarding.",
    attachment: { filename: "offer-letter.pdf", sizeLabel: "188 KB" },
  },
];

const OUTLOOK_DEMO: DemoEmail[] = [
  {
    id: "o1",
    subject: "Econ 301 - Problem Set 4 solutions",
    from: "Prof. Daniel Reyes",
    receivedAt: "Mon, 9:12 AM",
    preview: "Attached are the solutions to Problem Set 4. Office hours this week are moved to Wednesday...",
    body: "Attached are the solutions to Problem Set 4. Office hours this week are moved to Wednesday, 2-4pm, same office. Let me know if you have questions before the midterm.",
    attachment: { filename: "problem-set-4-solutions.pdf", sizeLabel: "412 KB" },
  },
];

export function EmailsClient() {
  const [open, setOpen] = useState<DemoEmail | null>(null);
  const { showToast } = useToast();

  function askAiAboutThis() {
    if (!open) return;
    askAssistant(`Help me with this email - "${open.subject}" from ${open.from}: ${open.body}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Emails</h1>
      <p className="mt-1 text-[14px] text-ink-2">Your connected inbox, read live from Gmail and Outlook - nothing here is copied or stored unless you save an attachment.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "gmail", label: "Gmail", content: <MessageList messages={GMAIL_DEMO} onOpen={setOpen} /> },
            { key: "outlook", label: "Outlook Mail", content: <MessageList messages={OUTLOOK_DEMO} onOpen={setOpen} /> },
          ]}
        />
      </div>

      <DetailPanel open={!!open} onClose={() => setOpen(null)} title={open?.subject ?? ""} subtitle={open?.from ?? ""}>
        {open ? (
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-[52px_1fr] gap-x-2 gap-y-1 border-b border-line pb-4 text-[12px]">
              <dt className="text-ink-3">From</dt><dd className="font-medium text-ink-1">{open.from}</dd>
              <dt className="text-ink-3">To</dt><dd className="text-ink-2">You</dd>
              <dt className="text-ink-3">Subject</dt><dd className="text-ink-2">{open.subject}</dd>
              <dt className="text-ink-3">Date</dt><dd className="text-ink-2">{open.receivedAt}</dd>
            </dl>
            <p className="whitespace-pre-wrap text-[14px] leading-7 text-ink-1">{open.body}</p>

            <Button variant="secondary" onClick={askAiAboutThis} className="w-fit">
              <MessageCircle size={14} /> Ask AI about this
            </Button>

            {open.attachment ? (
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attachments</p>
                <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip size={14} className="flex-shrink-0 text-ink-3" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-1">{open.attachment.filename}</p>
                      <p className="text-[11.5px] text-ink-3">{open.attachment.sizeLabel}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => showToast({ title: `Saved "${open.attachment!.filename}" to Documents` })}>
                    Save to Documents
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailPanel>
    </div>
  );
}

function MessageList({ messages, onOpen }: { messages: DemoEmail[]; onOpen: (m: DemoEmail) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-ink-2">Your most recent inbox messages.</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {messages.map((message) => (
          <button
            key={message.id}
            onClick={() => onOpen(message)}
            className="block w-full border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-surface-raised"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-ink-1">{message.subject}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-2">{message.from}</p>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-3">{message.preview}</p>
              </div>
              <span className="flex-shrink-0 text-[11px] text-ink-3">{message.receivedAt}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

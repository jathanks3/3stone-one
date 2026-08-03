"use client";

import { useState } from "react";
import { Mail, Paperclip } from "lucide-react";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";

interface DemoEmail {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  preview: string;
  body: string;
  attachment?: { filename: string; sizeLabel: string };
}

const DEMO_EMAILS: DemoEmail[] = [
  {
    id: "1",
    subject: "Group project - meeting moved to Thursday 4pm",
    from: "Priya Nair",
    receivedAt: "Yesterday, 6:41 PM",
    preview: "Hey, quick change - the study group is moving to Thursday at 4pm in the library instead of Wednesday...",
    body: "Hey, quick change - the study group is moving to Thursday at 4pm in the library instead of Wednesday. Same room. Bring your notes on chapter 6, we're splitting up the summary.",
  },
  {
    id: "2",
    subject: "Econ 301 - Problem Set 4 solutions",
    from: "Prof. Daniel Reyes",
    receivedAt: "Mon, 9:12 AM",
    preview: "Attached are the solutions to Problem Set 4. Office hours this week are moved to Wednesday...",
    body: "Attached are the solutions to Problem Set 4. Office hours this week are moved to Wednesday, 2-4pm, same office. Let me know if you have questions before the midterm.",
    attachment: { filename: "problem-set-4-solutions.pdf", sizeLabel: "412 KB" },
  },
  {
    id: "3",
    subject: "Internship offer - next steps",
    from: "Recruiting, Northline Analytics",
    receivedAt: "Last week",
    preview: "Congratulations again! Attached is your offer letter - please review and sign by Friday...",
    body: "Congratulations again! Attached is your offer letter - please review and sign by Friday. Reach out if you have any questions about start date or onboarding.",
    attachment: { filename: "offer-letter.pdf", sizeLabel: "188 KB" },
  },
];

export function EmailsClient() {
  const [selected, setSelected] = useState<DemoEmail | null>(null);
  const { showToast } = useToast();

  const columns: Column<DemoEmail>[] = [
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
    { key: "receivedAt", header: "Received", render: (m) => m.receivedAt },
    { key: "attachment", header: "", render: (m) => (m.attachment ? <Badge tone="neutral">Attachment</Badge> : null) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Emails</h1>
        <p className="mt-1 text-[14px] text-ink-2">Your connected inbox, read live from Gmail or Outlook - nothing here is copied or stored unless you save an attachment.</p>
      </div>

      <div className="mt-6">
        <DataTable columns={columns} rows={DEMO_EMAILS} rowKey={(m) => m.id} onRowClick={setSelected} />
      </div>

      <DetailPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.subject ?? ""} subtitle={selected?.from ?? ""}>
        {selected ? (
          <div className="flex flex-col gap-5">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-1">{selected.body}</p>
            {selected.attachment ? (
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Attachments</p>
                <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip size={14} className="flex-shrink-0 text-ink-3" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-1">{selected.attachment.filename}</p>
                      <p className="text-[11.5px] text-ink-3">{selected.attachment.sizeLabel}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => showToast({ title: `Saved "${selected.attachment!.filename}" to Documents` })}>
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

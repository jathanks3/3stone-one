"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Eye, FileText, Send, Truck, Upload } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Tabs } from "@/ui/Tabs";
import { useToast } from "@/lib/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { DEMO_DOCUMENTS, DEMO_INVOICES, DEMO_JOBS, DEMO_VENDORS, getTasksForJob } from "@/server/mock-data";

const CLIENT_ORG_ID = "org_riverside";
const CLIENT_JOB_ID = "job_riverside";

export function ClientPortalClient() {
  const job = DEMO_JOBS.find((j) => j.id === CLIENT_JOB_ID)!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 rounded-2xl border border-accent-wash-strong bg-accent-wash px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-accent">
          <Eye size={14} /> Client Portal preview — this is what a client or a vendor sees when they log in.
        </p>
      </div>

      <h1 className="text-[22px] font-bold text-ink-1">{job.name}</h1>
      <p className="mt-1 text-[14px] text-ink-2">Shared with both the client and the vendors working this job.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "client", label: "Client View", content: <ClientView /> },
            { key: "vendor", label: "Vendor View", content: <VendorView /> },
          ]}
        />
      </div>
    </div>
  );
}

function ClientView() {
  const { showToast } = useToast();
  const job = DEMO_JOBS.find((j) => j.id === CLIENT_JOB_ID)!;
  const tasks = getTasksForJob(CLIENT_JOB_ID);
  const sharedDocs = DEMO_DOCUMENTS.filter((d) => d.organizationId === CLIENT_ORG_ID && d.visibility === "shared");
  const invoice = DEMO_INVOICES.find((i) => i.client === "Riverside Properties" && i.status !== "paid");

  const [milestoneApproved, setMilestoneApproved] = useState(false);
  const [paid, setPaid] = useState(invoice ? invoice.status === "paid" : true);
  const [paying, setPaying] = useState(false);
  const [messages, setMessages] = useState([
    { id: "1", from: "them", body: "Really happy with progress so far — the kitchen looks great!" },
    { id: "2", from: "us", body: "Thank you! We're on track for the final inspection in a couple weeks." },
  ]);
  const [draft, setDraft] = useState("");

  function payInvoice() {
    setPaying(true);
    window.setTimeout(() => {
      setPaid(true);
      setPaying(false);
      showToast({ title: "Payment successful", description: `${invoice?.number} paid via Stripe (test mode).` });
    }, 1100);
  }

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}`, from: "them", body: draft }]);
    setDraft("");
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
      <div className="flex flex-col gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-ink-1">{job.name}</p>
            <Badge tone="accent">In Progress</Badge>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">{doneCount}/{tasks.length} milestones complete · due {new Date(job.dueDate).toLocaleDateString()}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
          </div>

          <div className="mt-4 rounded-[10px] border border-line bg-bg p-3.5">
            <p className="text-[13px] font-semibold text-ink-1">Milestone: Final electrical inspection</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Ready for your sign-off before we schedule the city inspection.</p>
            {milestoneApproved ? (
              <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-good">
                <CheckCircle2 size={14} /> Approved
              </p>
            ) : (
              <div className="mt-2.5 flex gap-2">
                <Button variant="primary" onClick={() => { setMilestoneApproved(true); showToast({ title: "Milestone approved", description: "Acme Construction has been notified." }); }}>
                  Approve
                </Button>
                <Button variant="secondary" onClick={() => showToast({ title: "Feedback sent", description: "Jane Dorsey will follow up shortly." })}>
                  Request changes
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-ink-1">Documents</p>
            <button
              onClick={() => showToast({ title: "File selected", description: "Upload received (demo only)." })}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-accent hover:text-accent-strong"
            >
              <Upload size={13} /> Upload a file
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {sharedDocs.map((d) => (
              <div key={d.id} className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-[13px] text-ink-2">
                <FileText size={14} className="text-ink-3" /> {d.name}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[15px] font-semibold text-ink-1">Invoice</p>
          {invoice ? (
            <div className="mt-3 flex items-center justify-between rounded-[10px] border border-line bg-bg px-3.5 py-3">
              <div>
                <p className="text-[14px] font-semibold text-ink-1">{invoice.number}</p>
                <p className="text-[12.5px] text-ink-3">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-bold text-ink-1">{formatCurrency(invoice.amount)}</span>
                {paid ? (
                  <Badge tone="good">Paid</Badge>
                ) : (
                  <Button variant="primary" onClick={payInvoice} disabled={paying}>
                    {paying ? "Processing…" : "Pay now"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-ink-3">No outstanding invoices.</p>
          )}
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-[15px] font-semibold text-ink-1">Message the team</p>
          <div className="flex flex-col gap-2.5">
            {messages.map((m) => (
              <div key={m.id} className={cn("max-w-[80%] rounded-[12px] px-3.5 py-2.5 text-[13.5px]", m.from === "them" ? "self-start bg-surface-raised text-ink-1" : "self-end bg-accent text-on-accent")}>
                {m.body}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Send a message…"
              className="h-10 flex-1 rounded-[9px] border border-line bg-bg px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
            />
            <button onClick={sendMessage} className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-accent text-on-accent hover:opacity-90" aria-label="Send">
              <Send size={15} />
            </button>
          </div>
        </Card>
      </div>
  );
}

function VendorView() {
  const job = DEMO_JOBS.find((j) => j.id === CLIENT_JOB_ID)!;
  const [vendorStatus, setVendorStatus] = useState<Record<string, boolean>>({
    ven_1: true,
    ven_2: false,
    ven_5: false,
  });

  const vendorTasks = [
    { vendorId: "ven_1", label: "Fixtures delivered to site" },
    { vendorId: "ven_2", label: "Plumbing rough-in complete" },
    { vendorId: "ven_5", label: "PPE restock confirmed for crew" },
  ];

  function toggle(vendorId: string) {
    setVendorStatus((prev) => ({ ...prev, [vendorId]: !prev[vendorId] }));
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <p className="text-[15px] font-semibold text-ink-1">{job.name} — timeline</p>
        <p className="mt-1 text-[13px] text-ink-3">
          Start {new Date(job.startDate).toLocaleDateString()} · Target completion {new Date(job.dueDate).toLocaleDateString()}
        </p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{job.description}</p>
      </Card>

      <Card className="p-5">
        <p className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink-1">
          <Truck size={15} className="text-ink-3" /> Vendor checklist
        </p>
        <div className="flex flex-col gap-2">
          {vendorTasks.map((t) => {
            const vendor = DEMO_VENDORS.find((v) => v.id === t.vendorId);
            const done = vendorStatus[t.vendorId];
            return (
              <button
                key={t.vendorId}
                onClick={() => toggle(t.vendorId)}
                className="flex items-center gap-2.5 rounded-[10px] border border-line bg-bg px-3.5 py-2.5 text-left"
              >
                {done ? (
                  <CheckCircle2 size={16} className="flex-shrink-0 text-good" />
                ) : (
                  <Circle size={16} className="flex-shrink-0 text-ink-3" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[13.5px] font-medium", done ? "text-ink-3 line-through" : "text-ink-1")}>{t.label}</p>
                  <p className="text-[12px] text-ink-3">{vendor?.name ?? "Vendor"}</p>
                </div>
                <Badge tone={done ? "good" : "neutral"}>{done ? "Done" : "Pending"}</Badge>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-[15px] font-semibold text-ink-1">Shared documents</p>
        <p className="mt-1 text-[12.5px] text-ink-3">
          Site plans and permits shared with vendors working this job — the same files visible in the client&rsquo;s Documents tab.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {DEMO_DOCUMENTS.filter((d) => d.jobId === CLIENT_JOB_ID && d.visibility === "shared").map((d) => (
            <div key={d.id} className="flex items-center gap-2.5 rounded-[9px] border border-line bg-bg px-3 py-2 text-[13px] text-ink-2">
              <FileText size={14} className="text-ink-3" /> {d.name}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, FileWarning, Landmark, XCircle } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { StatTile } from "@/ui/StatTile";
import { Badge } from "@/ui/Badge";
import { DataTable, type Column } from "@/ui/DataTable";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { useToast } from "@/lib/toast";
import { cn, formatCurrency } from "@/lib/utils";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { VendorExpenseChart } from "./VendorExpenseChart";
import {
  BUDGETS,
  CASH_FLOW_MONTHLY,
  CASH_RUNWAY_DAYS,
  DEMO_INVOICES,
  MONTHLY_FINANCIALS,
  PENDING_PURCHASE_REQUESTS,
  PROFIT_MTD,
  REVENUE_DELTA_PCT,
  REVENUE_MTD,
  VENDOR_EXPENSES,
} from "@/server/mock-data";
import { cashFlowWarning, explainRevenueTrend, invoiceInsights } from "@/server/ai/capabilities";
import type { Invoice, InvoiceStatus, PurchaseRequest } from "@/types";

const INVOICE_TONE: Record<InvoiceStatus, "good" | "accent" | "critical"> = {
  paid: "good",
  sent: "accent",
  overdue: "critical",
};

export function FinanceClient() {
  const [restrictToOwner, setRestrictToOwner] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Finance</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            Revenue, profit, invoices, purchase requests, and budgets — synced from QuickBooks, not a replacement for it.
          </p>
        </div>
        <button
          onClick={() => {
            setRestrictToOwner((v) => !v);
            showToast({
              title: !restrictToOwner ? "Finance restricted to Owner" : "Finance visibility restored",
              description: !restrictToOwner
                ? "Admins will no longer see Finance until this is turned back off."
                : "Admins can see Finance again.",
            });
          }}
          className="flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 text-[12.5px] font-medium text-ink-2 hover:bg-surface-raised"
        >
          <span
            className={cn(
              "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
              restrictToOwner ? "bg-accent justify-end" : "bg-line justify-start"
            )}
          >
            <span className="h-4 w-4 rounded-full bg-surface" />
          </span>
          Restrict to Owner
        </button>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "overview", label: "Overview", content: <OverviewTab /> },
            { key: "invoices", label: "Invoices", content: <InvoicesTab /> },
            { key: "expenses", label: "Expenses", content: <ExpensesTab /> },
            { key: "requests", label: "Purchase Requests", content: <PurchaseRequestsTab /> },
            { key: "budgets", label: "Budgets", content: <BudgetsTab /> },
          ]}
        />
      </div>
    </div>
  );
}

function OverviewTab() {
  const outstanding = DEMO_INVOICES.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Revenue (MTD)" value={formatCurrency(REVENUE_MTD, { compact: true })} deltaPct={REVENUE_DELTA_PCT} direction="up" deltaTone="good" />
        <StatTile label="Profit (MTD)" value={formatCurrency(PROFIT_MTD, { compact: true })} deltaPct={8} direction="up" deltaTone="good" />
        <StatTile label="Cash Flow" value={`+${formatCurrency(CASH_FLOW_MONTHLY, { compact: true })}/mo`} />
        <StatTile label="Outstanding" value={formatCurrency(outstanding, { compact: true })} />
      </div>
      <p className="text-[12.5px] text-ink-3">{CASH_RUNWAY_DAYS} days of runway at the current burn rate.</p>

      <RevenueExpenseChart data={MONTHLY_FINANCIALS} />

      <Card className="p-5">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Explain trend" run={explainRevenueTrend} />
          <AiAction label="Cash-flow warning" run={cashFlowWarning} />
          <AiAction label="Invoice insights" run={invoiceInsights} />
        </AiActionRow>
      </Card>
    </div>
  );
}

function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const { showToast } = useToast();
  const filtered = invoices.filter((i) => filter === "all" || i.status === filter);

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Invoice", render: (i) => <span className="font-medium text-ink-1">{i.number}</span> },
    { key: "client", header: "Client", render: (i) => i.client },
    { key: "amount", header: "Amount", render: (i) => formatCurrency(i.amount) },
    { key: "status", header: "Status", render: (i) => <Badge tone={INVOICE_TONE[i.status]}>{i.status}</Badge> },
    { key: "due", header: "Due", render: (i) => new Date(i.dueDate).toLocaleDateString() },
    {
      key: "action",
      header: "",
      render: (i) =>
        i.status !== "paid" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInvoices((prev) => prev.map((x) => (x.id === i.id ? { ...x, status: "paid" } : x)));
              showToast({ title: "Invoice marked paid", description: `${i.number} marked as paid.` });
            }}
            className="text-[12.5px] font-semibold text-accent hover:text-accent-strong"
          >
            Mark paid
          </button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {(["all", "sent", "overdue", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
              filter === f ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={FileWarning} title="No invoices" description="Nothing matches this filter." />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(i) => i.id} />
      )}
    </div>
  );
}

function ExpensesTab() {
  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <p className="mb-4 text-[13px] font-semibold text-ink-2">Vendor expenses (this quarter)</p>
        <VendorExpenseChart data={VENDOR_EXPENSES} />
      </Card>
    </div>
  );
}

function PurchaseRequestsTab() {
  const [requests, setRequests] = useState<PurchaseRequest[]>(PENDING_PURCHASE_REQUESTS);
  const { showToast } = useToast();

  function decide(id: string, status: "approved" | "rejected") {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    showToast({ title: `Purchase request ${status}`, description: "The requester has been notified." });
  }

  if (requests.length === 0) {
    return <EmptyState icon={Landmark} title="Nothing pending" description="All purchase requests have been decided." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-[14px] font-semibold text-ink-1">{r.requestedBy} — {formatCurrency(r.amount)}</p>
            <p className="text-[12.5px] text-ink-3">{r.reason}</p>
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => decide(r.id, "rejected")}>
                <XCircle size={14} /> Reject
              </Button>
              <Button variant="primary" onClick={() => decide(r.id, "approved")}>
                <CheckCircle2 size={14} /> Approve
              </Button>
            </div>
          ) : (
            <Badge tone={r.status === "approved" ? "good" : "critical"}>{r.status}</Badge>
          )}
        </Card>
      ))}
    </div>
  );
}

function BudgetsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {BUDGETS.map((b) => {
        const pct = Math.round((b.spent / b.amount) * 100);
        return (
          <Card key={b.department} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-ink-1">{b.department}</p>
              <p className="text-[12.5px] text-ink-3">
                {formatCurrency(b.spent, { compact: true })} / {formatCurrency(b.amount, { compact: true })}
              </p>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-raised">
              <div
                className={cn("h-full rounded-full", pct > 90 ? "bg-critical" : pct > 70 ? "bg-warning" : "bg-good")}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink-3">{pct}% utilized</p>
          </Card>
        );
      })}
    </div>
  );
}

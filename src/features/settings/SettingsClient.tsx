"use client";

import { useState } from "react";
import { Check, Key, Plus, Trash2 } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Avatar } from "@/ui/Avatar";
import { DataTable, type Column } from "@/ui/DataTable";
import { useIndustry } from "@/lib/industry";
import { useToast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";
import { industryProfileList } from "@/config/industry-profiles";
import { BILLING, COMPANY_PROFILE, DEMO_API_KEYS, DEMO_EMPLOYEES } from "@/server/mock-data";
import type { ApiKeyRecord, Employee, UserRole } from "@/types";

export function SettingsClient() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Settings</h1>
      <p className="mt-1 text-[14px] text-ink-2">Company profile, branding, users, industry, billing, and API keys.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "company", label: "Company", content: <CompanyTab /> },
            { key: "branding", label: "Branding", content: <BrandingTab /> },
            { key: "users", label: "Users", content: <UsersTab /> },
            { key: "industry", label: "Industry Profile", content: <IndustryTab /> },
            { key: "billing", label: "Billing", content: <BillingTab /> },
            { key: "keys", label: "API Keys", content: <ApiKeysTab /> },
          ]}
        />
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      <input
        defaultValue={defaultValue}
        className="h-10 rounded-[9px] border border-line bg-surface px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
      />
    </label>
  );
}

function CompanyTab() {
  const { showToast } = useToast();
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name" defaultValue={COMPANY_PROFILE.name} />
        <Field label="Legal name" defaultValue={COMPANY_PROFILE.legalName} />
        <Field label="Phone" defaultValue={COMPANY_PROFILE.phone} />
        <Field label="Website" defaultValue={COMPANY_PROFILE.website} />
      </div>
      <Field label="Address" defaultValue={COMPANY_PROFILE.address} />
      <Button variant="primary" className="w-fit" onClick={() => showToast({ title: "Company profile saved" })}>
        Save changes
      </Button>
    </Card>
  );
}

const SWATCHES = ["#3f63a8", "#0ca30c", "#a86a1f", "#7d3fa8", "#c94f6d"];

function BrandingTab() {
  const [swatch, setSwatch] = useState(SWATCHES[0]);
  const { showToast } = useToast();

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div>
        <p className="mb-2 text-[12.5px] font-medium text-ink-2">Logo</p>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-bg text-[11px] text-ink-3">
          Logo
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12.5px] font-medium text-ink-2">Primary color</p>
        <div className="flex gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setSwatch(c)}
              style={{ background: c }}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2"
              aria-label={c}
            >
              {swatch === c ? <Check size={14} className="text-white" /> : null}
            </button>
          ))}
        </div>
      </div>
      <Button variant="primary" className="w-fit" onClick={() => showToast({ title: "Branding saved", description: "Preview updated across the workspace." })}>
        Save changes
      </Button>
    </Card>
  );
}

const ROLES: UserRole[] = ["Owner", "Admin", "Manager", "Member"];

function UsersTab() {
  const [employees, setEmployees] = useState<Employee[]>(DEMO_EMPLOYEES);
  const { showToast } = useToast();

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Name",
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={e.initials} size={26} />
          <span className="font-medium text-ink-1">{e.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (e) => e.email },
    {
      key: "role",
      header: "Role",
      render: (e) => (
        <select
          value={e.role}
          onChange={(ev) => {
            const role = ev.target.value as UserRole;
            setEmployees((prev) => prev.map((x) => (x.id === e.id ? { ...x, role } : x)));
            showToast({ title: `${e.name}'s role updated`, description: `Now ${role}.` });
          }}
          className="h-8 rounded-[7px] border border-line bg-surface px-2 text-[12.5px] text-ink-1"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    { key: "status", header: "Status", render: (e) => <Badge tone={e.status === "active" ? "good" : "neutral"}>{e.status}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => showToast({ title: "Invite sent", description: "An invitation email has been sent." })}>
          <Plus size={14} /> Invite user
        </Button>
      </div>
      <DataTable columns={columns} rows={employees} rowKey={(e) => e.id} />
    </div>
  );
}

function IndustryTab() {
  const { profile, setIndustryKey } = useIndustry();
  return (
    <Card className="p-5">
      <p className="mb-1 text-[13.5px] text-ink-2">
        Current: <span className="font-semibold text-ink-1">{profile.label}</span>
      </p>
      <p className="mb-4 text-[12.5px] text-ink-3">
        Changing this relabels the app immediately. Your data is not changed or lost — only how it&rsquo;s displayed.
      </p>
      <div className="flex flex-col gap-1.5">
        {industryProfileList.map((p) => (
          <button
            key={p.key}
            onClick={() => setIndustryKey(p.key)}
            className="flex items-center justify-between rounded-[9px] border border-line bg-bg px-3.5 py-2.5 text-left text-[13.5px] hover:bg-surface-raised"
          >
            {p.label}
            {p.key === profile.key ? <Check size={15} className="text-accent" /> : null}
          </button>
        ))}
      </div>
    </Card>
  );
}

function BillingTab() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink-1">{BILLING.plan} plan</p>
            <p className="text-[12.5px] text-ink-3">{BILLING.seatCount} seats · {BILLING.paymentMethod}</p>
          </div>
          <p className="text-[20px] font-bold text-ink-1">${BILLING.price}<span className="text-[13px] font-medium text-ink-3">/mo</span></p>
        </div>
        <p className="mt-3 text-[12.5px] text-ink-3">Next invoice on {new Date(BILLING.nextInvoiceDate).toLocaleDateString()}</p>
      </Card>
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Invoice history</p>
        <div className="flex flex-col gap-2">
          {BILLING.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2.5 text-[13px]">
              <span className="text-ink-2">{new Date(h.date).toLocaleDateString()}</span>
              <span className="text-ink-1">{formatCurrency(h.amount)}</span>
              <Badge tone="good">{h.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(DEMO_API_KEYS);
  const { showToast } = useToast();

  function generate() {
    const key: ApiKeyRecord = {
      id: `key_${Date.now()}`,
      label: "New key",
      lastFour: Math.random().toString(16).slice(2, 6),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    setKeys((prev) => [key, ...prev]);
    showToast({ title: "API key generated", description: "Copy it now — it won't be shown again." });
  }

  function revoke(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    showToast({ title: "API key revoked" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={generate}>
          <Key size={14} /> Generate new key
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-ink-1">{k.label}</p>
              <p className="font-mono text-[12px] text-ink-3">•••• {k.lastFour}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] text-ink-3">{k.lastUsedAt ?? "Never used"}</span>
              <button onClick={() => revoke(k.id)} className="text-critical hover:opacity-80" aria-label="Revoke">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

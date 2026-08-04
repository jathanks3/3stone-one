"use client";

import { useMemo, useState, useTransition } from "react";
import { Building2, Mail, Phone, Plus, Trash2, Users } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { Tabs } from "@/ui/Tabs";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { KanbanBoard, type KanbanColumn } from "@/ui/KanbanBoard";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import type { WildApricotContact } from "@/server/services/wildApricotIntegrationService";
import type { SalesforceAccount, SalesforceContact, SalesforceOpportunity } from "@/server/services/salesforceIntegrationService";
import {
  createDealAction,
  createOrganizationAction,
  createPersonAction,
  deleteDealAction,
  deleteOrganizationAction,
  deletePersonAction,
  moveDealStageAction,
} from "@/app/(app)/crm/actions";
import type { DealRow, OrganizationRow, PersonRow } from "@/server/services/crmService";

const PIPELINE_STAGES: { key: string; label: string }[] = [
  { key: "new_lead", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export function RealCrmClient({
  initialOrganizations,
  initialPeople,
  initialDeals,
  wildApricotConnected = false,
  wildApricotContacts = [],
  salesforceConnected = false,
  salesforceAccounts = [],
  salesforceContacts = [],
  salesforceOpportunities = [],
}: {
  initialOrganizations: OrganizationRow[];
  initialPeople: PersonRow[];
  initialDeals: DealRow[];
  wildApricotConnected?: boolean;
  wildApricotContacts?: WildApricotContact[];
  salesforceConnected?: boolean;
  salesforceAccounts?: SalesforceAccount[];
  salesforceContacts?: SalesforceContact[];
  salesforceOpportunities?: SalesforceOpportunity[];
}) {
  const { profile } = useIndustry();
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [people, setPeople] = useState(initialPeople);
  const [deals, setDeals] = useState(initialDeals);
  const [selectedPerson, setSelectedPerson] = useState<PersonRow | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationRow | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">{profile.terms.customers}</h1>
      <p className="mt-1 text-[14px] text-ink-2">Leads, {profile.terms.customers.toLowerCase()}, companies, and your sales pipeline.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            {
              key: "pipeline",
              label: "Pipeline",
              content: <PipelineTab deals={deals} setDeals={setDeals} people={people} organizations={organizations} />,
            },
            {
              key: "leads",
              label: "Leads",
              content: <PeopleTab type="lead" people={people} setPeople={setPeople} organizations={organizations} onSelect={setSelectedPerson} />,
            },
            {
              key: "customers",
              label: profile.terms.customers,
              content: <PeopleTab type="customer" people={people} setPeople={setPeople} organizations={organizations} onSelect={setSelectedPerson} />,
            },
            {
              key: "companies",
              label: "Companies",
              content: <CompaniesTab organizations={organizations} setOrganizations={setOrganizations} onSelect={setSelectedOrg} />,
            },
          ]}
        />
      </div>

      {wildApricotConnected ? (
        <div className="mt-8">
          <div className="mb-3">
            <h2 className="text-[16px] font-semibold text-ink-1">Wild Apricot members</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">Members stay in Wild Apricot; 3Stone One does not duplicate their records.</p>
          </div>
          {wildApricotContacts.length === 0 ? (
            <div className="rounded-[12px] border border-line bg-surface p-4 text-[13px] text-ink-3">No members found for this account.</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {wildApricotContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5">
                  <Avatar initials={c.displayName.slice(0, 2).toUpperCase()} size={24} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-1">{c.displayName}</p>
                    <p className="truncate text-[11.5px] text-ink-3">{c.membershipLevel ?? c.status ?? c.email ?? ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {salesforceConnected ? (
        <section className="mt-8">
          <div className="mb-3"><h2 className="text-[16px] font-semibold text-ink-1">Salesforce</h2><p className="mt-0.5 text-[12.5px] text-ink-3">Live, read-only CRM records; make source changes in Salesforce.</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4"><p className="text-[12px] font-semibold uppercase text-ink-3">Accounts</p>{salesforceAccounts.slice(0, 20).map((row) => <p key={row.Id} className="mt-2 text-[12.5px] font-medium text-ink-1">{row.Name}</p>)}</Card>
            <Card className="p-4"><p className="text-[12px] font-semibold uppercase text-ink-3">Contacts</p>{salesforceContacts.slice(0, 20).map((row) => <div key={row.Id} className="mt-2"><p className="text-[12.5px] font-medium text-ink-1">{row.Name}</p><p className="text-[10.5px] text-ink-3">{row.Account?.Name ?? row.Email ?? ""}</p></div>)}</Card>
            <Card className="p-4"><p className="text-[12px] font-semibold uppercase text-ink-3">Opportunities</p>{salesforceOpportunities.slice(0, 20).map((row) => <div key={row.Id} className="mt-2"><p className="text-[12.5px] font-medium text-ink-1">{row.Name}</p><p className="text-[10.5px] text-ink-3">{row.StageName}{row.Amount != null ? ` · ${formatCurrency(row.Amount)}` : ""}</p></div>)}</Card>
          </div>
        </section>
      ) : null}

      <DetailPanel
        open={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : ""}
        subtitle={selectedPerson?.organizationName ?? selectedPerson?.email ?? ""}
      >
        {selectedPerson ? <PersonDetail person={selectedPerson} deals={deals} /> : null}
      </DetailPanel>

      <DetailPanel open={!!selectedOrg} onClose={() => setSelectedOrg(null)} title={selectedOrg?.name ?? ""} subtitle={selectedOrg?.industry ?? undefined}>
        {selectedOrg ? <OrgDetail org={selectedOrg} people={people} deals={deals} /> : null}
      </DetailPanel>
    </div>
  );
}

function PipelineTab({
  deals,
  setDeals,
  people,
  organizations,
}: {
  deals: DealRow[];
  setDeals: React.Dispatch<React.SetStateAction<DealRow[]>>;
  people: PersonRow[];
  organizations: OrganizationRow[];
}) {
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const columns: KanbanColumn<DealRow>[] = PIPELINE_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    items: deals.filter((d) => d.stageKey === stage.key),
  }));

  function move(deal: DealRow, toStage: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dealId", deal.id);
      fd.set("stageKey", toStage);
      const result = await moveDealStageAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't move deal", description: result.error });
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stageKey: toStage } : d)));
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const personId = String(form.get("personId") ?? "");
    const person = people.find((p) => p.id === personId);
    if (!person) return showToast({ title: "Pick a contact first", description: "Add a lead or customer before creating a deal." });
    startTransition(async () => {
      const result = await createDealAction({}, form);
      if (result.error || !result.id) return showToast({ title: "Couldn't create deal", description: result.error ?? "Something went wrong." });
      setDeals((prev) => [
        { id: result.id!, title: String(form.get("title")), value: Number(form.get("value") ?? 0), stageKey: "new_lead", personId, personName: `${person.firstName} ${person.lastName}`, organizationId: person.organizationId, organizationName: person.organizationName },
        ...prev,
      ]);
      setCreating(false);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> New deal
        </Button>
      </div>
      {deals.length === 0 ? (
        <EmptyState icon={Building2} title="No deals yet" description="Add a contact, then create your first deal." />
      ) : (
        <KanbanBoard
          columns={columns}
          cardKey={(d) => d.id}
          onMove={(deal, toStage) => move(deal, toStage)}
          renderCard={(deal) => (
            <div>
              <p className="text-[13px] font-semibold leading-snug text-ink-1">{deal.title}</p>
              <p className="mt-1 text-[12.5px] font-medium text-accent">{formatCurrency(deal.value, { compact: true })}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Avatar initials={deal.personName.split(" ").map((n) => n[0]).join("")} size={18} />
                <span className="truncate text-[11.5px] text-ink-3">{deal.personName}</span>
              </div>
            </div>
          )}
        />
      )}

      <DetailPanel open={creating} onClose={() => setCreating(false)} title="New deal">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Title
            <input name="title" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Value ($)
            <input name="value" type="number" min={0} step="1" defaultValue={0} className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Contact
            <select name="personId" required className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent">
              <option value="">Select a contact…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
            Create
          </button>
        </form>
      </DetailPanel>
    </div>
  );
}

function PeopleTab({
  type,
  people,
  setPeople,
  organizations,
  onSelect,
}: {
  type: "lead" | "customer";
  people: PersonRow[];
  setPeople: React.Dispatch<React.SetStateAction<PersonRow[]>>;
  organizations: OrganizationRow[];
  onSelect: (p: PersonRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      people.filter((p) => p.personType === type).filter((p) =>
        `${p.firstName} ${p.lastName} ${p.organizationName ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [people, type, query]
  );

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("personType", type);
    startTransition(async () => {
      const result = await createPersonAction({}, form);
      if (result.error || !result.id) return showToast({ title: "Couldn't add contact", description: result.error ?? "Something went wrong." });
      const orgId = String(form.get("organizationId") ?? "") || null;
      const org = organizations.find((o) => o.id === orgId);
      setPeople((prev) => [
        {
          id: result.id!,
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          email: String(form.get("email") ?? "") || null,
          phone: String(form.get("phone") ?? "") || null,
          organizationId: orgId,
          organizationName: org?.name ?? null,
          personType: type,
          ownerId: null,
          ownerName: "You",
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setCreating(false);
    });
  }

  const columns: Column<PersonRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={`${p.firstName[0]}${p.lastName[0]}`} size={26} />
          <span className="font-medium text-ink-1">{p.firstName} {p.lastName}</span>
        </div>
      ),
    },
    { key: "org", header: "Company", render: (p) => p.organizationName ?? "—" },
    { key: "email", header: "Email", render: (p) => p.email ?? "—" },
    { key: "owner", header: "Owner", render: (p) => p.ownerName ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder={`Search ${type === "lead" ? "leads" : "customers"}…`} />
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> Add
        </Button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No matches" description="Try a different search, or add your first contact." />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} onRowClick={onSelect} />
      )}

      <DetailPanel open={creating} onClose={() => setCreating(false)} title={type === "lead" ? "New lead" : "New customer"}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[12.5px] font-medium text-ink-2">
              First name
              <input name="firstName" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
            </label>
            <label className="text-[12.5px] font-medium text-ink-2">
              Last name
              <input name="lastName" required className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
            </label>
          </div>
          <label className="text-[12.5px] font-medium text-ink-2">
            Email
            <input name="email" type="email" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Phone
            <input name="phone" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Company
            <select name="organizationId" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent">
              <option value="">No company</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
            Add
          </button>
        </form>
      </DetailPanel>
    </div>
  );
}

function CompaniesTab({
  organizations,
  setOrganizations,
  onSelect,
}: {
  organizations: OrganizationRow[];
  setOrganizations: React.Dispatch<React.SetStateAction<OrganizationRow[]>>;
  onSelect: (o: OrganizationRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filtered = useMemo(() => organizations.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())), [organizations, query]);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOrganizationAction({}, form);
      if (result.error || !result.id) return showToast({ title: "Couldn't add company", description: result.error ?? "Something went wrong." });
      setOrganizations((prev) => [
        { id: result.id!, name: String(form.get("name")), domain: String(form.get("domain") ?? "") || null, industry: String(form.get("industry") ?? "") || null, ownerId: null, ownerName: "You", createdAt: new Date() },
        ...prev,
      ]);
      setCreating(false);
    });
  }

  const columns: Column<OrganizationRow>[] = [
    {
      key: "name",
      header: "Company",
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-wash text-[11px] font-bold text-accent">{o.name.slice(0, 2).toUpperCase()}</span>
          <span className="font-medium text-ink-1">{o.name}</span>
        </div>
      ),
    },
    { key: "domain", header: "Domain", render: (o) => o.domain || "—" },
    { key: "industry", header: "Industry", render: (o) => o.industry ?? "—" },
    { key: "created", header: "Added", render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search companies…" />
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> Add company
        </Button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No matches" description="Try a different search, or add your first company." />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(o) => o.id} onRowClick={onSelect} />
      )}

      <DetailPanel open={creating} onClose={() => setCreating(false)} title="New company">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Name
            <input name="name" required autoFocus className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Domain
            <input name="domain" placeholder="example.com" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Industry
            <input name="industry" className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={isPending} className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
            Add
          </button>
        </form>
      </DetailPanel>
    </div>
  );
}

function PersonDetail({ person, deals }: { person: PersonRow; deals: DealRow[] }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const personDeals = deals.filter((d) => d.personId === person.id);

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("personId", person.id);
      const result = await deletePersonAction({}, fd);
      if (result.error) showToast({ title: "Couldn't delete", description: result.error });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-[13.5px]">
        {person.email ? <div className="flex items-center gap-2 text-ink-2"><Mail size={14} className="text-ink-3" /> {person.email}</div> : null}
        {person.phone ? <div className="flex items-center gap-2 text-ink-2"><Phone size={14} className="text-ink-3" /> {person.phone}</div> : null}
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Deals</p>
        <div className="flex flex-col gap-2">
          {personDeals.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-[10px] border border-line bg-bg px-3 py-2">
              <span className="text-[13px] text-ink-1">{d.title}</span>
              <Badge tone={d.stageKey === "won" ? "good" : d.stageKey === "lost" ? "critical" : "accent"}>
                {PIPELINE_STAGES.find((s) => s.key === d.stageKey)?.label ?? d.stageKey}
              </Badge>
            </div>
          ))}
          {personDeals.length === 0 ? <p className="text-[13px] text-ink-3">No deals yet.</p> : null}
        </div>
      </div>

      <Button variant="secondary" disabled={isPending} onClick={remove}>Delete contact</Button>
    </div>
  );
}

function OrgDetail({ org, people, deals }: { org: OrganizationRow; people: PersonRow[]; deals: DealRow[] }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const orgPeople = people.filter((p) => p.organizationId === org.id);
  const orgDeals = deals.filter((d) => d.organizationId === org.id);
  const wonValue = orgDeals.filter((d) => d.stageKey === "won").reduce((s, d) => s + d.value, 0);

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("orgId", org.id);
      const result = await deleteOrganizationAction({}, fd);
      if (result.error) showToast({ title: "Couldn't delete", description: result.error });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Lifetime value</p>
          <p className="mt-1 text-[18px] font-bold text-ink-1">{formatCurrency(wonValue, { compact: true })}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Owner</p>
          <p className="mt-1 text-[14px] font-semibold text-ink-1">{org.ownerName ?? "Unassigned"}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Contacts</p>
        <div className="flex flex-col gap-2">
          {orgPeople.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-bg px-3 py-2">
              <Avatar initials={`${p.firstName[0]}${p.lastName[0]}`} size={24} />
              <span className="text-[13px] text-ink-1">{p.firstName} {p.lastName}</span>
              <span className="ml-auto text-[12px] text-ink-3">{p.email}</span>
            </div>
          ))}
          {orgPeople.length === 0 ? <p className="text-[13px] text-ink-3">No contacts on file.</p> : null}
        </div>
      </div>
      <Button variant="secondary" disabled={isPending} onClick={remove}>Delete company</Button>
    </div>
  );
}

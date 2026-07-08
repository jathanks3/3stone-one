"use client";

import { useMemo, useState } from "react";
import { Building2, Mail, Phone, Users } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { Tabs } from "@/ui/Tabs";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { KanbanBoard, type KanbanColumn } from "@/ui/KanbanBoard";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { formatCurrency } from "@/lib/utils";
import {
  DEMO_DEALS,
  DEMO_ORGANIZATIONS,
  DEMO_PEOPLE,
  PIPELINE_STAGES,
  getEmployeeName,
} from "@/server/mock-data";
import { draftProposal, predictCustomerHealth, summarizeCustomerHistory } from "@/server/ai/capabilities";
import type { Deal, Organization, Person, PipelineStageKey } from "@/types";

function orgName(id: string | null) {
  return DEMO_ORGANIZATIONS.find((o) => o.id === id)?.name ?? null;
}

export function CrmClient() {
  const { profile } = useIndustry();
  const [deals, setDeals] = useState<Deal[]>(DEMO_DEALS);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">{profile.terms.customers}</h1>
      <p className="mt-1 text-[14px] text-ink-2">
        Leads, {profile.terms.customers.toLowerCase()}, companies, and your sales pipeline.
      </p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "pipeline", label: "Pipeline", content: <PipelineTab deals={deals} setDeals={setDeals} /> },
            {
              key: "leads",
              label: "Leads",
              content: (
                <PeopleTab
                  type="lead"
                  onSelect={setSelectedPerson}
                />
              ),
            },
            {
              key: "customers",
              label: profile.terms.customers,
              content: (
                <PeopleTab
                  type="customer"
                  onSelect={setSelectedPerson}
                />
              ),
            },
            { key: "companies", label: "Companies", content: <CompaniesTab onSelect={setSelectedOrg} /> },
          ]}
        />
      </div>

      <DetailPanel
        open={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : ""}
        subtitle={selectedPerson ? orgName(selectedPerson.organizationId) ?? selectedPerson.email : ""}
      >
        {selectedPerson ? <PersonDetail person={selectedPerson} /> : null}
      </DetailPanel>

      <DetailPanel
        open={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        title={selectedOrg?.name ?? ""}
        subtitle={selectedOrg?.industry}
      >
        {selectedOrg ? <OrgDetail org={selectedOrg} /> : null}
      </DetailPanel>
    </div>
  );
}

function PipelineTab({ deals, setDeals }: { deals: Deal[]; setDeals: (d: Deal[]) => void }) {
  const columns: KanbanColumn<Deal>[] = PIPELINE_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    items: deals.filter((d) => d.stage === stage.key),
  }));

  return (
    <KanbanBoard
      columns={columns}
      cardKey={(d) => d.id}
      onMove={(deal, toStage) => {
        setDeals(deals.map((d) => (d.id === deal.id ? { ...d, stage: toStage as PipelineStageKey } : d)));
      }}
      renderCard={(deal) => {
        const person = DEMO_PEOPLE.find((p) => p.id === deal.personId);
        return (
          <div>
            <p className="text-[13px] font-semibold leading-snug text-ink-1">{deal.title}</p>
            <p className="mt-1 text-[12.5px] font-medium text-accent">{formatCurrency(deal.value, { compact: true })}</p>
            {person ? (
              <div className="mt-2 flex items-center gap-1.5">
                <Avatar initials={`${person.firstName[0]}${person.lastName[0]}`} size={18} />
                <span className="truncate text-[11.5px] text-ink-3">{person.firstName} {person.lastName}</span>
              </div>
            ) : null}
          </div>
        );
      }}
    />
  );
}

function PeopleTab({ type, onSelect }: { type: "lead" | "customer"; onSelect: (p: Person) => void }) {
  const [query, setQuery] = useState("");
  const people = useMemo(
    () =>
      DEMO_PEOPLE.filter((p) => p.personType === type).filter((p) =>
        `${p.firstName} ${p.lastName} ${orgName(p.organizationId) ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [type, query]
  );

  const columns: Column<Person>[] = [
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
    { key: "org", header: "Company", render: (p) => orgName(p.organizationId) ?? "—" },
    { key: "email", header: "Email", render: (p) => p.email },
    { key: "contact", header: "Last Contact", render: (p) => p.lastContact },
    { key: "owner", header: "Owner", render: (p) => getEmployeeName(p.ownerId) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={query} onChange={setQuery} placeholder={`Search ${type === "lead" ? "leads" : "customers"}…`} />
      {people.length === 0 ? (
        <EmptyState icon={Users} title="No matches" description="Try a different search term." />
      ) : (
        <DataTable columns={columns} rows={people} rowKey={(p) => p.id} onRowClick={onSelect} />
      )}
    </div>
  );
}

function CompaniesTab({ onSelect }: { onSelect: (o: Organization) => void }) {
  const [query, setQuery] = useState("");
  const orgs = useMemo(
    () => DEMO_ORGANIZATIONS.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const columns: Column<Organization>[] = [
    {
      key: "name",
      header: "Company",
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-wash text-[11px] font-bold text-accent">
            {o.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-medium text-ink-1">{o.name}</span>
        </div>
      ),
    },
    { key: "domain", header: "Domain", render: (o) => o.domain || "—" },
    { key: "industry", header: "Industry", render: (o) => o.industry },
    { key: "owner", header: "Owner", render: (o) => getEmployeeName(o.ownerId) },
    { key: "created", header: "Customer Since", render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={query} onChange={setQuery} placeholder="Search companies…" />
      {orgs.length === 0 ? (
        <EmptyState icon={Building2} title="No matches" description="Try a different search term." />
      ) : (
        <DataTable columns={columns} rows={orgs} rowKey={(o) => o.id} onRowClick={onSelect} />
      )}
    </div>
  );
}

function PersonDetail({ person }: { person: Person }) {
  const deals = DEMO_DEALS.filter((d) => d.personId === person.id);
  const org = orgName(person.organizationId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-[13.5px]">
        <div className="flex items-center gap-2 text-ink-2">
          <Mail size={14} className="text-ink-3" /> {person.email}
        </div>
        <div className="flex items-center gap-2 text-ink-2">
          <Phone size={14} className="text-ink-3" /> {person.phone}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Deals</p>
        <div className="flex flex-col gap-2">
          {deals.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-[10px] border border-line bg-bg px-3 py-2">
              <span className="text-[13px] text-ink-1">{d.title}</span>
              <Badge tone={d.stage === "won" ? "good" : d.stage === "lost" ? "critical" : "accent"}>
                {d.stage.replace("_", " ")}
              </Badge>
            </div>
          ))}
          {deals.length === 0 ? <p className="text-[13px] text-ink-3">No deals yet.</p> : null}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Summarize history" run={() => summarizeCustomerHistory(person, org)} />
          <AiAction label="Draft proposal" run={() => draftProposal(person, org, deals[0])} />
          <AiAction label="Predict health" run={() => predictCustomerHealth(person)} />
        </AiActionRow>
      </div>
    </div>
  );
}

function OrgDetail({ org }: { org: Organization }) {
  const people = DEMO_PEOPLE.filter((p) => p.organizationId === org.id);
  const deals = DEMO_DEALS.filter((d) => d.organizationId === org.id);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Lifetime value</p>
          <p className="mt-1 text-[18px] font-bold text-ink-1">{formatCurrency(wonValue, { compact: true })}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] font-medium text-ink-3">Owner</p>
          <p className="mt-1 text-[14px] font-semibold text-ink-1">{getEmployeeName(org.ownerId)}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Contacts</p>
        <div className="flex flex-col gap-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-bg px-3 py-2">
              <Avatar initials={`${p.firstName[0]}${p.lastName[0]}`} size={24} />
              <span className="text-[13px] text-ink-1">{p.firstName} {p.lastName}</span>
              <span className="ml-auto text-[12px] text-ink-3">{p.email}</span>
            </div>
          ))}
          {people.length === 0 ? <p className="text-[13px] text-ink-3">No contacts on file.</p> : null}
        </div>
      </div>
    </div>
  );
}

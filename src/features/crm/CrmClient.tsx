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
import { PIPELINE_STAGES } from "@/server/mock-data";
import { getIndustryDataset, getDatasetEmployeeName, getDatasetOrgName } from "@/server/mock-data/industries";
import { draftProposal, predictCustomerHealth, summarizeCustomerHistory } from "@/server/ai/capabilities";
import type { Deal, IndustryDataset, Organization, Person, PipelineStageKey } from "@/types";

export function CrmClient() {
  const { profile } = useIndustry();
  const dataset = getIndustryDataset(profile.key);
  const [deals, setDeals] = useState<Deal[]>(dataset.deals);
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
            {
              key: "pipeline",
              label: "Pipeline",
              content: <PipelineTab deals={deals} setDeals={setDeals} dataset={dataset} />,
            },
            {
              key: "leads",
              label: "Leads",
              content: <PeopleTab type="lead" dataset={dataset} onSelect={setSelectedPerson} />,
            },
            {
              key: "customers",
              label: profile.terms.customers,
              content: <PeopleTab type="customer" dataset={dataset} onSelect={setSelectedPerson} />,
            },
            {
              key: "companies",
              label: "Companies",
              content: <CompaniesTab dataset={dataset} onSelect={setSelectedOrg} />,
            },
          ]}
        />
      </div>

      <DetailPanel
        open={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : ""}
        subtitle={selectedPerson ? getDatasetOrgName(selectedPerson.organizationId, dataset) ?? selectedPerson.email : ""}
      >
        {selectedPerson ? <PersonDetail person={selectedPerson} dataset={dataset} /> : null}
      </DetailPanel>

      <DetailPanel
        open={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        title={selectedOrg?.name ?? ""}
        subtitle={selectedOrg?.industry}
      >
        {selectedOrg ? <OrgDetail org={selectedOrg} dataset={dataset} /> : null}
      </DetailPanel>
    </div>
  );
}

function PipelineTab({
  deals,
  setDeals,
  dataset,
}: {
  deals: Deal[];
  setDeals: (d: Deal[]) => void;
  dataset: IndustryDataset;
}) {
  const stageLabels = dataset.pipelineStageLabels;
  const columns: KanbanColumn<Deal>[] = PIPELINE_STAGES.map((stage) => ({
    key: stage.key,
    label: stageLabels?.[stage.key] ?? stage.label,
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
        const person = dataset.people.find((p) => p.id === deal.personId);
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

function PeopleTab({
  type,
  dataset,
  onSelect,
}: {
  type: "lead" | "customer";
  dataset: IndustryDataset;
  onSelect: (p: Person) => void;
}) {
  const [query, setQuery] = useState("");
  const people = useMemo(
    () =>
      dataset.people.filter((p) => p.personType === type).filter((p) =>
        `${p.firstName} ${p.lastName} ${getDatasetOrgName(p.organizationId, dataset) ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [type, query, dataset]
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
    { key: "org", header: "Company", render: (p) => getDatasetOrgName(p.organizationId, dataset) ?? "—" },
    { key: "email", header: "Email", render: (p) => p.email },
    { key: "contact", header: "Last Contact", render: (p) => p.lastContact },
    { key: "owner", header: "Owner", render: (p) => getDatasetEmployeeName(p.ownerId, dataset) },
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

function CompaniesTab({ dataset, onSelect }: { dataset: IndustryDataset; onSelect: (o: Organization) => void }) {
  const [query, setQuery] = useState("");
  const orgs = useMemo(
    () => dataset.organizations.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())),
    [query, dataset]
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
    { key: "owner", header: "Owner", render: (o) => getDatasetEmployeeName(o.ownerId, dataset) },
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

function PersonDetail({ person, dataset }: { person: Person; dataset: IndustryDataset }) {
  const deals = dataset.deals.filter((d) => d.personId === person.id);
  const org = getDatasetOrgName(person.organizationId, dataset);

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
                {(dataset.pipelineStageLabels?.[d.stage] ?? d.stage.replace("_", " "))}
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

function OrgDetail({ org, dataset }: { org: Organization; dataset: IndustryDataset }) {
  const people = dataset.people.filter((p) => p.organizationId === org.id);
  const deals = dataset.deals.filter((d) => d.organizationId === org.id);
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
          <p className="mt-1 text-[14px] font-semibold text-ink-1">{getDatasetEmployeeName(org.ownerId, dataset)}</p>
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

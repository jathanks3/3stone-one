"use client";

import { useMemo, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { Tabs } from "@/ui/Tabs";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Card } from "@/ui/Card";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { cn } from "@/lib/utils";
import { DEMO_ANNOUNCEMENTS, DEMO_DEPARTMENTS, DEMO_EMPLOYEES, DEMO_JOBS, getEmployeeName } from "@/server/mock-data";
import { identifyBurnoutSignals, recommendStaffing } from "@/server/ai/capabilities";
import type { Announcement, Employee } from "@/types";

export function PeopleClient() {
  const { profile } = useIndustry();
  const [selected, setSelected] = useState<Employee | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">{profile.terms.employees}</h1>
      <p className="mt-1 text-[14px] text-ink-2">
        Directory, departments, roles, and announcements for your {profile.terms.employees.toLowerCase()}.
      </p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "directory", label: "Directory", content: <DirectoryTab employeeWord={profile.terms.employee} onSelect={setSelected} /> },
            { key: "departments", label: "Departments", content: <DepartmentsTab /> },
            { key: "announcements", label: "Announcements", content: <AnnouncementsTab /> },
          ]}
        />
      </div>

      <DetailPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} subtitle={selected?.title}>
        {selected ? <EmployeeDetail employee={selected} /> : null}
      </DetailPanel>
    </div>
  );
}

function DirectoryTab({ employeeWord, onSelect }: { employeeWord: string; onSelect: (e: Employee) => void }) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<string>("all");

  const filtered = useMemo(
    () =>
      DEMO_EMPLOYEES.filter((e) => dept === "all" || e.department === dept).filter((e) =>
        `${e.name} ${e.title}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query, dept]
  );

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
    { key: "title", header: "Title", render: (e) => e.title },
    { key: "department", header: "Department", render: (e) => e.department },
    { key: "email", header: "Email", render: (e) => e.email },
    {
      key: "status",
      header: "Status",
      render: (e) => <Badge tone={e.status === "active" ? "good" : "neutral"}>{e.status === "active" ? "Active" : "Away"}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["all", ...DEMO_DEPARTMENTS.map((d) => d.name)].map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                dept === d ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
              )}
            >
              {d === "all" ? `All ${employeeWord}s` : d}
            </button>
          ))}
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder={`Search ${employeeWord.toLowerCase()}s…`} />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No matches" description="Try a different filter or search term." />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(e) => e.id} onRowClick={onSelect} />
      )}
    </div>
  );
}

function DepartmentsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {DEMO_DEPARTMENTS.map((d) => {
        const members = DEMO_EMPLOYEES.filter((e) => e.department === d.name);
        return (
          <Card key={d.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-ink-1">{d.name}</p>
              <span className="text-[12px] text-ink-3">{members.length} people</span>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">Led by {getEmployeeName(d.leadId)}</p>
            <div className="mt-3 flex -space-x-2">
              {members.map((m) => (
                <Avatar key={m.id} initials={m.initials} size={30} className="border-2 border-surface" />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS);
  const [draft, setDraft] = useState("");

  function post() {
    if (!draft.trim()) return;
    setAnnouncements((prev) => [
      { id: `ann_new_${Date.now()}`, title: draft, body: draft, authorId: "user_demo", at: "Just now" },
      ...prev,
    ]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && post()}
          placeholder="Post a company-wide announcement…"
          className="h-10 flex-1 rounded-[9px] border border-line bg-surface px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
        />
        <Button variant="primary" onClick={post}>
          <Megaphone size={14} /> Post
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-ink-1">{a.title}</p>
              <span className="text-[12px] text-ink-3">{a.at}</span>
            </div>
            <p className="mt-1.5 text-[13.5px] text-ink-2">{a.body}</p>
            <p className="mt-2 text-[12px] text-ink-3">— {getEmployeeName(a.authorId)}{a.department ? ` · ${a.department}` : ""}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmployeeDetail({ employee }: { employee: Employee }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] text-ink-3">Department</p>
          <p className="mt-1 font-semibold text-ink-1">{employee.department}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] text-ink-3">Hired</p>
          <p className="mt-1 font-semibold text-ink-1">{new Date(employee.hireDate).toLocaleDateString()}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] text-ink-3">Email</p>
          <p className="mt-1 truncate font-semibold text-ink-1">{employee.email}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-bg p-3">
          <p className="text-[11px] text-ink-3">Phone</p>
          <p className="mt-1 font-semibold text-ink-1">{employee.phone}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
        <AiActionRow>
          <AiAction label="Identify burnout signals" run={() => identifyBurnoutSignals(DEMO_EMPLOYEES)} />
          <AiAction label="Recommend staffing" run={() => recommendStaffing(DEMO_JOBS, DEMO_EMPLOYEES)} />
        </AiActionRow>
      </div>
    </div>
  );
}

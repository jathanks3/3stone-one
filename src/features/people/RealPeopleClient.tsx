"use client";

import { useState, useTransition } from "react";
import { Megaphone, Plus, Trash2, Users } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { Tabs } from "@/ui/Tabs";
import { DataTable, type Column } from "@/ui/DataTable";
import { EmptyState } from "@/ui/EmptyState";
import { Card } from "@/ui/Card";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import {
  assignMemberDepartmentAction,
  createAnnouncementAction,
  createDepartmentAction,
  deleteAnnouncementAction,
} from "@/app/(app)/people/actions";
import type { AnnouncementRow, DepartmentRow, DirectoryMemberRow } from "@/server/services/peopleService";

function initialsFromName(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function RealPeopleClient({
  initialMembers,
  initialDepartments,
  initialAnnouncements,
}: {
  initialMembers: DirectoryMemberRow[];
  initialDepartments: DepartmentRow[];
  initialAnnouncements: AnnouncementRow[];
}) {
  const { profile } = useIndustry();
  const [members, setMembers] = useState(initialMembers);
  const [departments, setDepartments] = useState(initialDepartments);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">{profile.terms.employees}</h1>
      <p className="mt-1 text-[14px] text-ink-2">Directory, departments, and announcements for your {profile.terms.employees.toLowerCase()}.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "directory", label: "Directory", content: <DirectoryTab members={members} setMembers={setMembers} departments={departments} /> },
            { key: "departments", label: "Departments", content: <DepartmentsTab departments={departments} setDepartments={setDepartments} members={members} /> },
            { key: "announcements", label: "Announcements", content: <AnnouncementsTab initial={initialAnnouncements} departments={departments} /> },
          ]}
        />
      </div>
    </div>
  );
}

function DirectoryTab({
  members,
  setMembers,
  departments,
}: {
  members: DirectoryMemberRow[];
  setMembers: React.Dispatch<React.SetStateAction<DirectoryMemberRow[]>>;
  departments: DepartmentRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function assign(memberId: string, departmentId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("memberId", memberId);
      fd.set("departmentId", departmentId);
      const result = await assignMemberDepartmentAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't update", description: result.error });
      const dept = departments.find((d) => d.id === departmentId);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, departmentId: departmentId || null, departmentName: dept?.name ?? null } : m)));
    });
  }

  const columns: Column<DirectoryMemberRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={initialsFromName(m.name)} size={26} />
          <span className="font-medium text-ink-1">{m.name}</span>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (m) => m.roleName },
    { key: "email", header: "Email", render: (m) => m.email },
    {
      key: "department",
      header: "Department",
      render: (m) => (
        <select
          defaultValue={m.departmentId ?? ""}
          onChange={(e) => assign(m.id, e.target.value)}
          disabled={isPending}
          onClick={(e) => e.stopPropagation()}
          className="h-8 rounded-[7px] border border-line-strong bg-bg px-2 text-[12.5px] text-ink-1 outline-none focus:border-accent"
        >
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      ),
    },
  ];

  return members.length === 0 ? (
    <EmptyState icon={Users} title="No team members yet" description="Invite your team from Settings to see them here." />
  ) : (
    <DataTable columns={columns} rows={members} rowKey={(m) => m.id} />
  );
}

function DepartmentsTab({
  departments,
  setDepartments,
  members,
}: {
  departments: DepartmentRow[];
  setDepartments: React.Dispatch<React.SetStateAction<DepartmentRow[]>>;
  members: DirectoryMemberRow[];
}) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name.trim());
      const result = await createDepartmentAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't add department", description: result.error ?? "Something went wrong." });
      setDepartments((prev) => [...prev, { id: result.id!, name: name.trim(), leadUserId: null, leadName: null, memberCount: 0 }]);
      setName("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New department name…"
          className="h-9 flex-1 rounded-[8px] border border-line-strong bg-bg px-3 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
        <button type="submit" disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
          <Plus size={14} /> Add
        </button>
      </form>

      {departments.length === 0 ? (
        <EmptyState icon={Users} title="No departments yet" description="Add your first department to start grouping your team." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {departments.map((d) => {
            const deptMembers = members.filter((m) => m.departmentId === d.id);
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-ink-1">{d.name}</p>
                  <span className="text-[12px] text-ink-3">{deptMembers.length} people</span>
                </div>
                <div className="mt-3 flex -space-x-2">
                  {deptMembers.map((m) => (
                    <Avatar key={m.id} initials={initialsFromName(m.name)} size={30} className="border-2 border-surface" />
                  ))}
                  {deptMembers.length === 0 ? <span className="text-[12.5px] text-ink-3">No one assigned yet.</span> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnnouncementsTab({ initial, departments }: { initial: AnnouncementRow[]; departments: DepartmentRow[] }) {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>(initial);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function post() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", draft.trim());
      fd.set("body", draft.trim());
      const result = await createAnnouncementAction({}, fd);
      if (result.error || !result.id) return showToast({ title: "Couldn't post", description: result.error ?? "Something went wrong." });
      setAnnouncements((prev) => [
        { id: result.id!, title: draft.trim(), body: draft.trim(), authorId: null, authorName: "You", departmentId: null, departmentName: null, publishedAt: new Date() },
        ...prev,
      ]);
      setDraft("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("announcementId", id);
      const result = await deleteAnnouncementAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete", description: result.error });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && post()}
          placeholder="Post an announcement…"
          className="h-10 flex-1 rounded-[9px] border border-line bg-surface px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-accent"
        />
        <Button variant="primary" disabled={isPending} onClick={post}>
          <Megaphone size={14} /> Post
        </Button>
      </div>
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Post the first update for your team." />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-ink-1">{a.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-ink-3">{new Date(a.publishedAt).toLocaleDateString()}</span>
                  <button onClick={() => remove(a.id)} disabled={isPending} aria-label="Delete announcement" className="text-ink-3 hover:text-critical">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-ink-3">— {a.authorName ?? "Someone"}{a.departmentName ? ` · ${a.departmentName}` : ""}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { EmptyState } from "@/ui/EmptyState";
import { Badge } from "@/ui/Badge";
import { cn } from "@/lib/utils";
import type { ActivityFeedRow } from "@/server/services/activityService";

function humanizeAction(action: string): string {
  return action.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function RealActivityClient({ initialActivity }: { initialActivity: ActivityFeedRow[] }) {
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("All");
  const entityTypes = useMemo(() => ["All", ...Array.from(new Set(initialActivity.map((a) => a.entityType)))], [initialActivity]);

  const rows = useMemo(
    () =>
      initialActivity
        .filter((a) => entityType === "All" || a.entityType === entityType)
        .filter((a) => `${humanizeAction(a.action)} ${a.actorName ?? ""}`.toLowerCase().includes(query.toLowerCase())),
    [initialActivity, query, entityType]
  );

  const columns: Column<ActivityFeedRow>[] = [
    { key: "message", header: "Event", render: (a) => <span className="text-ink-1">{humanizeAction(a.action)}</span>, className: "max-w-[440px]" },
    { key: "actor", header: "Actor", render: (a) => a.actorName ?? "System" },
    { key: "module", header: "Module", render: (a) => <Badge tone="neutral">{a.entityType}</Badge> },
    { key: "when", header: "When", render: (a) => new Date(a.createdAt).toLocaleString() },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Activity Log</h1>
      <p className="mt-1 text-[14px] text-ink-2">A full audit trail of everything that happens in this workspace.</p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {entityTypes.map((m) => (
              <button
                key={m}
                onClick={() => setEntityType(m)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  entityType === m ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search activity…" />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={History} title="Nothing yet" description="Actions across your workspace will show up here." />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { EmptyState } from "@/ui/EmptyState";
import { Badge } from "@/ui/Badge";
import { cn } from "@/lib/utils";
import { DEMO_ACTIVITY } from "@/server/mock-data";
import type { ActivityItem } from "@/types";

const MODULES = ["All", ...Array.from(new Set(DEMO_ACTIVITY.map((a) => a.module)))];

export function ActivityClient() {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("All");

  const rows = useMemo(
    () =>
      DEMO_ACTIVITY.filter((a) => module === "All" || a.module === module).filter((a) =>
        `${a.message} ${a.actor}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query, module]
  );

  const columns: Column<ActivityItem>[] = [
    { key: "message", header: "Event", render: (a) => <span className="text-ink-1">{a.message}</span>, className: "max-w-[440px]" },
    { key: "actor", header: "Actor", render: (a) => a.actor },
    { key: "module", header: "Module", render: (a) => <Badge tone="neutral">{a.module}</Badge> },
    { key: "when", header: "When", render: (a) => a.timestamp },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Activity Log</h1>
      <p className="mt-1 text-[14px] text-ink-2">A full audit trail of everything that happens in this workspace.</p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {MODULES.map((m) => (
              <button
                key={m}
                onClick={() => setModule(m)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  module === m ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search activity…" />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={History} title="Nothing found" description="Try a different filter or search term." />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} />
        )}
      </div>
    </div>
  );
}

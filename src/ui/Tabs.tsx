"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: { key: string; label: string; content: ReactNode }[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "relative flex-shrink-0 px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
              active === tab.key ? "text-ink-1" : "text-ink-3 hover:text-ink-2"
            )}
          >
            {tab.label}
            {active === tab.key ? (
              <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-accent" />
            ) : null}
          </button>
        ))}
      </div>
      <div className="pt-5">{activeTab?.content}</div>
    </div>
  );
}

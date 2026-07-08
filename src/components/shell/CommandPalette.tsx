"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { getAllNavItems } from "@/lib/nav";
import { NAV_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  // Mounted fresh every time it opens, so query/activeIndex start blank
  // without needing an effect to reset them.
  return <PaletteDialog onClose={() => onOpenChange(false)} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { profile } = useIndustry();
  const items = useMemo(() => getAllNavItems(profile), [profile]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  function go(index: number) {
    const item = filtered[index];
    if (!item) return;
    router.push(item.href);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <Search size={16} className="text-ink-3" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                go(activeIndex);
              }
            }}
            placeholder="Jump to a page…"
            className="flex-1 bg-transparent text-[15px] text-ink-1 outline-none placeholder:text-ink-3"
          />
          <kbd className="rounded-[6px] border border-line px-1.5 py-0.5 text-[11px] text-ink-3">Esc</kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13.5px] text-ink-3">No pages match “{query}.”</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = NAV_ICONS[item.icon];
              return (
                <button
                  key={item.key}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13.5px]",
                    i === activeIndex ? "bg-accent-wash text-accent" : "text-ink-1"
                  )}
                >
                  {Icon ? <Icon size={16} strokeWidth={1.9} /> : null}
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

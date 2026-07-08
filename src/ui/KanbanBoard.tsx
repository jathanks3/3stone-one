"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KanbanColumn<T> {
  key: string;
  label: string;
  items: T[];
}

export function KanbanBoard<T>({
  columns,
  onMove,
  renderCard,
  cardKey,
}: {
  columns: KanbanColumn<T>[];
  onMove: (item: T, toColumnKey: string) => void;
  renderCard: (item: T) => ReactNode;
  cardKey: (item: T) => string;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((col) => (
        <div
          key={col.key}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverCol(col.key);
          }}
          onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
          onDrop={(e) => {
            e.preventDefault();
            const itemKey = e.dataTransfer.getData("text/plain");
            const item = columns.flatMap((c) => c.items).find((it) => cardKey(it) === itemKey);
            if (item) onMove(item, col.key);
            setDragOverCol(null);
            setDragKey(null);
          }}
          className={cn(
            "flex w-[264px] flex-shrink-0 flex-col rounded-2xl border border-line bg-surface p-2.5 transition-colors",
            dragOverCol === col.key && "border-accent bg-accent-wash"
          )}
        >
          <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
            <span className="text-[12.5px] font-semibold text-ink-2">{col.label}</span>
            <span className="rounded-full bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.items.map((item) => (
              <div
                key={cardKey(item)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", cardKey(item));
                  setDragKey(cardKey(item));
                }}
                onDragEnd={() => setDragKey(null)}
                className={cn(
                  "cursor-grab rounded-[10px] border border-line bg-surface-raised p-3 shadow-[var(--shadow)] transition-opacity active:cursor-grabbing",
                  dragKey === cardKey(item) && "opacity-40"
                )}
              >
                {renderCard(item)}
              </div>
            ))}
            {col.items.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-line py-6 text-center text-[12px] text-ink-3">
                Drop here
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

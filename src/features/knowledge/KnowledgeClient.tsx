"use client";

import { useMemo, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { SearchInput } from "@/ui/SearchInput";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { cn } from "@/lib/utils";
import { DEMO_ARTICLES, KNOWLEDGE_CATEGORY_LABEL } from "@/server/mock-data";
import type { KnowledgeArticle, KnowledgeCategory } from "@/types";

const CATEGORIES: (KnowledgeCategory | "all")[] = ["all", "policy", "training", "process", "sop", "video"];

export function KnowledgeClient() {
  const [category, setCategory] = useState<KnowledgeCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
  const [askQuery, setAskQuery] = useState("");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const filtered = useMemo(
    () =>
      DEMO_ARTICLES.filter((a) => category === "all" || a.category === category).filter((a) =>
        `${a.title} ${a.body}`.toLowerCase().includes(query.toLowerCase())
      ),
    [category, query]
  );

  function askKnowledge() {
    if (!askQuery.trim()) return;
    setAsking(true);
    setAskAnswer(null);
    const q = askQuery.toLowerCase();
    const match = DEMO_ARTICLES.find((a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
    window.setTimeout(() => {
      setAskAnswer(
        match
          ? `Based on "${match.title}": ${match.body.slice(0, 220)}${match.body.length > 220 ? "…" : ""}`
          : "No article directly matches that yet — try asking about safety, onboarding, invoicing, or PTO."
      );
      setAsking(false);
    }, 600);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Knowledge Center</h1>
      <p className="mt-1 text-[14px] text-ink-2">Policies, training, processes, SOPs, and video — your company wiki.</p>

      <div className="mt-5 rounded-2xl border border-accent-wash-strong bg-accent-wash p-4">
        <div className="flex items-center gap-2 text-accent">
          <Sparkles size={15} strokeWidth={2.25} />
          <p className="text-[12px] font-semibold uppercase tracking-wide">Ask company knowledge</p>
        </div>
        <div className="mt-2.5 flex gap-2">
          <input
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askKnowledge()}
            placeholder="e.g. What's our PTO policy?"
            className="h-10 flex-1 rounded-[9px] border border-accent-wash-strong bg-surface px-3.5 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3"
          />
          <button
            onClick={askKnowledge}
            disabled={asking}
            className="rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-70"
          >
            {asking ? "Searching…" : "Ask"}
          </button>
        </div>
        {askAnswer ? <p className="mt-3 text-[13.5px] leading-relaxed text-ink-1">{askAnswer}</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  category === c ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
                )}
              >
                {c === "all" ? "All" : KNOWLEDGE_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search articles…" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No articles found" description="Try a different filter or search term." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Card key={a.id} className="cursor-pointer p-4 transition-colors hover:bg-surface-raised" onClick={() => setSelected(a)}>
                <Badge tone="neutral">{KNOWLEDGE_CATEGORY_LABEL[a.category]}</Badge>
                <p className="mt-2.5 text-[14px] font-semibold leading-snug text-ink-1">{a.title}</p>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] text-ink-3">{a.body}</p>
                <p className="mt-2.5 text-[11.5px] text-ink-3">Updated {new Date(a.updatedAt).toLocaleDateString()} · {a.author}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={selected ? `${KNOWLEDGE_CATEGORY_LABEL[selected.category]} · ${selected.author}` : ""}
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            <p className="text-[13.5px] leading-relaxed text-ink-2">{selected.body}</p>
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
              <AiActionRow>
                <AiAction
                  label="Summarize"
                  run={() => `In short: ${selected.body.split(".")[0]}.`}
                />
              </AiActionRow>
            </div>
          </div>
        ) : null}
      </DetailPanel>
    </div>
  );
}

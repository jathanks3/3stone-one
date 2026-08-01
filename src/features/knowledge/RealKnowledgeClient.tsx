"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Plus } from "lucide-react";
import { SearchInput } from "@/ui/SearchInput";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import {
  createKnowledgeArticleAction,
  deleteKnowledgeArticleAction,
  updateKnowledgeArticleAction,
} from "@/app/(app)/knowledge/actions";
import type { KnowledgeArticleRow } from "@/server/services/knowledgeService";

const KNOWLEDGE_CATEGORY_LABEL: Record<string, string> = {
  policy: "Policy",
  training: "Training",
  process: "Process",
  sop: "SOP",
  video: "Video",
};

const CATEGORIES = ["all", "policy", "training", "process", "sop", "video"] as const;

export function RealKnowledgeClient({ initialArticles }: { initialArticles: KnowledgeArticleRow[] }) {
  const [articles, setArticles] = useState<KnowledgeArticleRow[]>(initialArticles);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KnowledgeArticleRow | null>(null);
  const [editing, setEditing] = useState<"new" | KnowledgeArticleRow | null>(null);
  const [form, setForm] = useState({ title: "", body: "", category: "process" as string });
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      articles
        .filter((a) => category === "all" || a.category === category)
        .filter((a) => `${a.title} ${a.body}`.toLowerCase().includes(query.toLowerCase())),
    [articles, category, query]
  );

  function openNew() {
    setForm({ title: "", body: "", category: "process" });
    setEditing("new");
  }

  function openEdit(a: KnowledgeArticleRow) {
    setForm({ title: a.title, body: a.body, category: a.category });
    setEditing(a);
    setSelected(null);
  }

  function save() {
    if (!form.title.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", form.title);
      fd.set("body", form.body);
      fd.set("category", form.category);
      if (editing === "new") {
        const result = await createKnowledgeArticleAction({}, fd);
        if (result.error) return showToast({ title: "Couldn't save article", description: result.error });
        setArticles((prev) => [
          { id: `pending_${Date.now()}`, title: form.title, body: form.body, category: form.category as never, videoUrl: null, authorName: "You", updatedAt: new Date() },
          ...prev,
        ]);
      } else if (editing) {
        fd.set("articleId", editing.id);
        const result = await updateKnowledgeArticleAction({}, fd);
        if (result.error) return showToast({ title: "Couldn't save article", description: result.error });
        setArticles((prev) =>
          prev.map((a) => (a.id === editing.id ? { ...a, title: form.title, body: form.body, category: form.category as never, updatedAt: new Date() } : a))
        );
      }
      setEditing(null);
    });
  }

  function remove(a: KnowledgeArticleRow) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("articleId", a.id);
      const result = await deleteKnowledgeArticleAction({}, fd);
      if (result.error) return showToast({ title: "Couldn't delete article", description: result.error });
      setArticles((prev) => prev.filter((x) => x.id !== a.id));
      setSelected(null);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Knowledge Center</h1>
          <p className="mt-1 text-[14px] text-ink-2">Policies, training, processes, and SOPs — your team's own knowledge base.</p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <Plus size={14} /> New article
        </Button>
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
          <EmptyState icon={BookOpen} title="No articles found" description="Try a different filter, or add your first article." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Card key={a.id} className="cursor-pointer p-4 transition-colors hover:bg-surface-raised" onClick={() => setSelected(a)}>
                <Badge tone="neutral">{KNOWLEDGE_CATEGORY_LABEL[a.category]}</Badge>
                <p className="mt-2.5 text-[14px] font-semibold leading-snug text-ink-1">{a.title}</p>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] text-ink-3">{a.body}</p>
                <p className="mt-2.5 text-[11.5px] text-ink-3">
                  Updated {new Date(a.updatedAt).toLocaleDateString()} {a.authorName ? `· ${a.authorName}` : ""}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={selected ? `${KNOWLEDGE_CATEGORY_LABEL[selected.category]}${selected.authorName ? ` · ${selected.authorName}` : ""}` : ""}
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-2">{selected.body}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(selected)}>Edit</Button>
              <Button variant="secondary" disabled={isPending} onClick={() => remove(selected)}>Delete</Button>
            </div>
          </div>
        ) : null}
      </DetailPanel>

      <DetailPanel open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New article" : "Edit article"}>
        <div className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Title
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent"
            >
              {CATEGORIES.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>{KNOWLEDGE_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Body
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={10}
              className="mt-1 w-full resize-none rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] leading-relaxed text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <button
            onClick={save}
            disabled={isPending}
            className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </DetailPanel>
    </div>
  );
}

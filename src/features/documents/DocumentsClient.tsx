"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { AiAction, AiActionRow } from "@/ui/AiAction";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { DEMO_DOCUMENTS, DOCUMENT_CATEGORY_LABEL, getEmployeeName } from "@/server/mock-data";
import { extractActionItems, rewriteDocument, summarizeDocument } from "@/server/ai/capabilities";
import type { DocumentCategory, DocumentFile } from "@/types";

const CATEGORIES: (DocumentCategory | "all")[] = ["all", "contract", "permit", "invoice", "plan", "photo", "report"];

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function DocumentsClient() {
  const [docs, setDocs] = useState<DocumentFile[]>(DEMO_DOCUMENTS);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DocumentFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      docs
        .filter((d) => category === "all" || d.category === category)
        .filter((d) => d.name.toLowerCase().includes(query.toLowerCase())),
    [docs, category, query]
  );

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const doc: DocumentFile = {
      id: `doc_new_${Date.now()}`,
      name: file.name,
      category: "report",
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      uploadedById: "user_demo",
      uploadedAt: new Date().toISOString(),
      jobId: null,
      organizationId: null,
      visibility: "internal",
    };
    setDocs((prev) => [doc, ...prev]);
    setJustAdded((prev) => new Set(prev).add(doc.id));
    showToast({ title: "Document added", description: `${file.name} was added to Documents.` });
    e.target.value = "";
  }

  const columns: Column<DocumentFile>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <FileText size={16} className="flex-shrink-0 text-ink-3" />
          <span className="truncate font-medium text-ink-1">{d.name}</span>
          {justAdded.has(d.id) ? <Badge tone="good">Just added</Badge> : null}
        </div>
      ),
    },
    { key: "category", header: "Category", render: (d) => <Badge tone="neutral">{DOCUMENT_CATEGORY_LABEL[d.category]}</Badge> },
    {
      key: "signature",
      header: "Signature",
      render: (d) =>
        d.signatureStatus ? (
          <Badge tone={d.signatureStatus === "signed" ? "good" : d.signatureStatus === "viewed" ? "accent" : "warning"}>
            {d.signatureStatus === "signed" ? "Signed" : d.signatureStatus === "viewed" ? "Viewed" : "Sent"}
          </Badge>
        ) : (
          <span className="text-ink-3">—</span>
        ),
    },
    { key: "size", header: "Size", render: (d) => formatSize(d.sizeKb) },
    { key: "uploadedBy", header: "Uploaded By", render: (d) => getEmployeeName(d.uploadedById) },
    { key: "date", header: "Date", render: (d) => new Date(d.uploadedAt).toLocaleDateString() },
    {
      key: "visibility",
      header: "Visibility",
      render: (d) => <Badge tone={d.visibility === "shared" ? "accent" : "neutral"}>{d.visibility === "shared" ? "Shared with client" : "Internal"}</Badge>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Documents</h1>
          <p className="mt-1 text-[14px] text-ink-2">Company and project files, shareable with clients.</p>
        </div>
        <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> Upload
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                  category === c
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line bg-surface text-ink-2 hover:bg-surface-raised"
                )}
              >
                {c === "all" ? "All" : DOCUMENT_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search documents…" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No documents found" description="Try a different filter or search term." />
        ) : (
          <DataTable columns={columns} rows={filtered} rowKey={(d) => d.id} onRowClick={setSelected} />
        )}
      </div>

      <DetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${DOCUMENT_CATEGORY_LABEL[selected.category]} · ${formatSize(selected.sizeKb)}` : ""}
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 text-[13.5px] text-ink-2">
              <p>Uploaded by {getEmployeeName(selected.uploadedById)} on {new Date(selected.uploadedAt).toLocaleDateString()}</p>
              <p>{selected.visibility === "shared" ? "Shared with the client via the Client Portal." : "Internal only."}</p>
              {selected.signatureStatus ? (
                <p className="flex items-center gap-1.5">
                  E-signature:{" "}
                  <Badge tone={selected.signatureStatus === "signed" ? "good" : selected.signatureStatus === "viewed" ? "accent" : "warning"}>
                    {selected.signatureStatus === "signed" ? "Signed" : selected.signatureStatus === "viewed" ? "Viewed, not signed" : "Sent, not yet viewed"}
                  </Badge>
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">AI actions</p>
              <AiActionRow>
                <AiAction label="Summarize" run={() => summarizeDocument(selected)} />
                <AiAction label="Rewrite" run={() => rewriteDocument(selected)} />
                <AiAction label="Extract action items" run={() => extractActionItems(selected)} />
              </AiActionRow>
            </div>
          </div>
        ) : null}
      </DetailPanel>
    </div>
  );
}

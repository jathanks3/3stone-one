"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AudioLines, BookOpen, FileText, ImageIcon, Library, Plus, Upload } from "lucide-react";
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
import type { CanvasCourseMaterial } from "@/server/services/canvasIntegrationService";
import type { DocumentRow } from "@/server/services/documentService";
import type { OneDriveFile } from "@/server/services/microsoftIntegrationService";
import type { GoogleDriveFile } from "@/server/services/googleIntegrationService";
import { createDocumentAction, getOneDrivePreviewUrlAction } from "@/app/(app)/documents/actions";
import { askAssistant } from "@/lib/assistantBus";

const KNOWLEDGE_CATEGORY_LABEL: Record<string, string> = {
  policy: "Policy",
  training: "Training",
  process: "Process",
  sop: "SOP",
  video: "Video",
};

const CATEGORIES = ["all", "policy", "training", "process", "sop", "video"] as const;
const ASSET_FILTERS = ["all", "files", "photos", "audio"] as const;
type AssetFilter = (typeof ASSET_FILTERS)[number];
type AssetKind = Exclude<AssetFilter, "all">;
type KnowledgeAsset = {
  id: string;
  name: string;
  mimeType: string;
  detail: string;
  source: string;
  kind: AssetKind;
  preview: "direct" | "onedrive" | "google" | "canvas";
  url: string;
  itemId?: string;
};

function assetKind(mimeType: string): AssetKind {
  if (mimeType.startsWith("image/")) return "photos";
  if (mimeType.startsWith("audio/")) return "audio";
  return "files";
}

export function RealKnowledgeClient({
  initialArticles,
  documents = [],
  oneDriveFiles = [],
  googleDriveFiles = [],
  canvasMaterials = [],
}: {
  initialArticles: KnowledgeArticleRow[];
  documents?: DocumentRow[];
  oneDriveFiles?: OneDriveFile[];
  googleDriveFiles?: GoogleDriveFile[];
  canvasMaterials?: CanvasCourseMaterial[];
}) {
  const [articles, setArticles] = useState<KnowledgeArticleRow[]>(initialArticles);
  const [libraryDocuments, setLibraryDocuments] = useState<DocumentRow[]>(documents);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [query, setQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all");
  const [assetPreview, setAssetPreview] = useState<KnowledgeAsset | null>(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const assets = useMemo<KnowledgeAsset[]>(() => [
    ...libraryDocuments.map((file) => ({ id: `upload:${file.id}`, name: file.name, mimeType: file.mimeType, detail: `${Math.max(1, Math.round(file.sizeBytes / 1024))} KB`, source: "3Stone Knowledge", kind: assetKind(file.mimeType), preview: "direct" as const, url: `/api/uploads/${file.uploadedFileId}/download` })),
    ...oneDriveFiles.map((file) => ({ id: `onedrive:${file.id}`, name: file.name, mimeType: file.mimeType, detail: file.modifiedAt ? `Updated ${new Date(file.modifiedAt).toLocaleDateString()}` : "Microsoft file", source: "Microsoft OneDrive", kind: assetKind(file.mimeType), preview: "onedrive" as const, url: file.webUrl, itemId: file.id })),
    ...googleDriveFiles.map((file) => ({ id: `google:${file.id}`, name: file.name, mimeType: file.mimeType, detail: file.modifiedAt ? `Updated ${new Date(file.modifiedAt).toLocaleDateString()}` : "Selected Google file", source: "Google Drive", kind: assetKind(file.mimeType), preview: "google" as const, url: `https://drive.google.com/file/d/${file.id}/preview` })),
    ...canvasMaterials.map((file) => ({ id: `canvas:${file.courseId}:${file.fileId}`, name: file.displayName, mimeType: file.contentType, detail: file.courseName, source: "Canvas", kind: assetKind(file.contentType), preview: "canvas" as const, url: `/api/integrations/canvas/files/${file.fileId}` })),
  ], [libraryDocuments, oneDriveFiles, googleDriveFiles, canvasMaterials]);

  const filteredAssets = useMemo(() => assets.filter((asset) => (assetFilter === "all" || asset.kind === assetFilter) && `${asset.name} ${asset.source} ${asset.detail}`.toLowerCase().includes(query.toLowerCase())), [assets, assetFilter, query]);

  function openAsset(asset: KnowledgeAsset) {
    setAssetPreview(asset);
    setPreviewSrc(asset.preview === "onedrive" ? "" : asset.url);
    if (asset.preview !== "onedrive" || !asset.itemId) return;
    setPreviewLoading(true);
    startTransition(async () => {
      const form = new FormData();
      form.set("itemId", asset.itemId!);
      const result = await getOneDrivePreviewUrlAction({}, form);
      setPreviewLoading(false);
      if (!result.url) {
        showToast({ title: "Preview unavailable", description: result.error ?? "Microsoft did not return a preview." });
        setAssetPreview(null);
        return;
      }
      setPreviewSrc(result.url);
    });
  }

  async function uploadKnowledgeFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const signResponse = await fetch("/api/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "document", filename: file.name, sizeBytes: file.size }) });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error ?? "Could not start upload.");
      const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!uploadResponse.ok) throw new Error("Upload failed.");
      const confirmResponse = await fetch("/api/uploads/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "document", storagePath: signed.storagePath, originalFilename: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size }) });
      const confirmed = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(confirmed.error ?? "Could not record upload.");
      const formData = new FormData();
      formData.set("name", file.name);
      formData.set("uploadedFileId", confirmed.id);
      formData.set("mimeType", file.type || "application/octet-stream");
      formData.set("sizeBytes", String(file.size));
      formData.set("visibility", "internal");
      const result = await createDocumentAction({}, formData);
      if (!result.id || result.error) throw new Error(result.error ?? "Could not add the file.");
      setLibraryDocuments((current) => [{ id: result.id!, uploadedFileId: confirmed.id, name: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, uploadedById: null, uploadedByName: "You", visibility: "internal", createdAt: new Date() }, ...current]);
      showToast({ title: "Added to Knowledge", description: `${file.name} is ready to preview.` });
    } catch (error) {
      showToast({ title: "Upload failed", description: error instanceof Error ? error.message : "Something went wrong." });
    } finally {
      setUploading(false);
    }
  }

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
        if (result.error || !result.id) return showToast({ title: "Couldn't save article", description: result.error ?? "Something went wrong." });
        setArticles((prev) => [
          { id: result.id!, title: form.title, body: form.body, category: form.category as never, videoUrl: null, authorName: "You", updatedAt: new Date() },
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
          <p className="mt-1 text-[14px] text-ink-2">Policies, training, processes, and SOPs — your team&apos;s own knowledge base.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload size={14} /> {uploading ? "Uploading…" : "Upload file, photo, or audio"}</Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={uploadKnowledgeFile} />
          <Button variant="primary" onClick={openNew}><Plus size={14} /> New article</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent"><Library size={18} /></div>
              <div>
                <h2 className="text-[15px] font-semibold text-ink-1">Connected knowledge</h2>
                <p className="mt-0.5 text-[12.5px] text-ink-3">Preview workspace uploads, OneDrive, selected Google Drive files, and Canvas materials here without being sent to a separate app.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {ASSET_FILTERS.map((filter) => <button key={filter} onClick={() => setAssetFilter(filter)} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-medium capitalize", assetFilter === filter ? "border-accent bg-accent text-on-accent" : "border-line bg-bg text-ink-2 hover:bg-surface-raised")}>{filter === "all" ? "Everything" : filter}</button>)}
              </div>
            </div>
            {filteredAssets.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{filteredAssets.slice(0, 60).map((asset) => <button key={asset.id} onClick={() => openAsset(asset)} className="rounded-xl border border-line bg-bg p-3 text-left hover:bg-surface-raised"><div className="flex items-start gap-2.5">{asset.kind === "photos" ? <ImageIcon size={16} className="mt-0.5 text-accent" /> : asset.kind === "audio" ? <AudioLines size={16} className="mt-0.5 text-accent" /> : <FileText size={16} className="mt-0.5 text-accent" />}<div className="min-w-0"><p className="truncate text-[13px] font-semibold text-ink-1">{asset.name}</p><p className="mt-1 truncate text-[11.5px] text-ink-3">{asset.source} · {asset.detail}</p></div></div></button>)}</div> : <p className="mt-4 text-[13px] text-ink-3">No items match this filter yet.</p>}
          </section>
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
          <SearchInput value={query} onChange={setQuery} placeholder="Search knowledge and files…" />
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

      <DetailPanel open={!!assetPreview} onClose={() => { setAssetPreview(null); setPreviewSrc(""); }} title={assetPreview?.name ?? ""} subtitle={assetPreview ? `${assetPreview.source} · ${assetPreview.mimeType}` : ""}>
        {previewLoading ? <p className="text-[13.5px] text-ink-3">Loading preview…</p> : assetPreview && previewSrc ? <div className="flex flex-col gap-4">
          {assetPreview.kind === "photos" && assetPreview.preview !== "onedrive" ? <img src={previewSrc} alt={assetPreview.name} className="max-h-[70vh] w-full rounded-xl border border-line object-contain" /> : assetPreview.kind === "audio" && assetPreview.preview !== "onedrive" ? <audio controls src={previewSrc} className="w-full" /> : <iframe src={previewSrc} title={assetPreview.name} className="h-[70vh] w-full rounded-xl border border-line" />}
          <Button variant="secondary" className="w-fit" onClick={() => askAssistant(`Help me work with "${assetPreview.name}" from ${assetPreview.source}. Use any content or metadata available in Knowledge Center, tell me clearly if you cannot read part of it, and ask what notes or next actions I want to make.`)}>Ask 3Stone AI</Button>
        </div> : null}
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

"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { FileText, Upload } from "lucide-react";
import { useIndustry } from "@/lib/industry";
import { SearchInput } from "@/ui/SearchInput";
import { DataTable, type Column } from "@/ui/DataTable";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { useToast } from "@/lib/toast";
import { createDocumentAction, deleteDocumentAction, setDocumentVisibilityAction, getOneDrivePreviewUrlAction } from "@/app/(app)/documents/actions";
import { askAssistant } from "@/lib/assistantBus";
import type { DocumentRow } from "@/server/services/documentService";
import type { OneDriveFile } from "@/server/services/microsoftIntegrationService";
import type { GoogleDriveFile } from "@/server/services/googleIntegrationService";
import type { CanvasCourseMaterial } from "@/server/services/canvasIntegrationService";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function RealDocumentsClient({
  initialDocuments,
  oneDriveConnected = false,
  oneDriveFiles = [],
  googleDriveConnected = false,
  googleDriveFiles = [],
  canvasConnected = false,
  canvasMaterials = [],
}: {
  initialDocuments: DocumentRow[];
  oneDriveConnected?: boolean;
  oneDriveFiles?: OneDriveFile[] | null;
  googleDriveConnected?: boolean;
  googleDriveFiles?: GoogleDriveFile[] | null;
  canvasConnected?: boolean;
  canvasMaterials?: CanvasCourseMaterial[];
}) {
  const [docs, setDocs] = useState<DocumentRow[]>(initialDocuments);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { profile, editionKey } = useIndustry();
  // Client Portal (the thing "shared_with_client" actually shares to)
  // isn't a Student-edition module at all - "customer"/profile.terms.customer
  // is this workspace's own real word ("Customer" for Workplace, "Contact"
  // for Student), never the hardcoded "client" this used to say regardless
  // of edition.
  const sharedLabel = `Shared with ${profile.terms.customer}`;
  const shareActionLabel = `Share with ${profile.terms.customer}`;

  function askAboutFile(name: string) {
    askAssistant(`Help me work with the file "${name}". Use any file metadata or content available to you. If you cannot read the file body, tell me clearly and ask me to open it or paste the relevant text instead of guessing.`);
  }

  // In-app preview for read-only integration files (OneDrive/Drive/Canvas)
  // - these were previously only ever a plain "opens a new tab" link.
  // Google's /preview URL pattern and Canvas's own file URL are both
  // embeddable directly; OneDrive has no equivalent public URL scheme, so
  // that one goes through getOneDrivePreviewUrlAction first (see below).
  const [previewFile, setPreviewFile] = useState<{ name: string; src: string; externalUrl: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  function previewGoogleDriveFile(file: GoogleDriveFile) {
    setPreviewFile({ name: file.name, src: `https://drive.google.com/file/d/${file.id}/preview`, externalUrl: file.webViewLink });
  }

  function previewCanvasFile(file: CanvasCourseMaterial) {
    setPreviewFile({ name: file.displayName, src: file.url, externalUrl: file.url });
  }

  function previewOneDriveFile(file: OneDriveFile) {
    setPreviewLoading(true);
    setPreviewFile({ name: file.name, src: "", externalUrl: file.webUrl });
    startTransition(async () => {
      const form = new FormData();
      form.set("itemId", file.id);
      const result = await getOneDrivePreviewUrlAction({}, form);
      setPreviewLoading(false);
      if (result.error || !result.url) {
        showToast({ title: "Couldn't preview this file", description: result.error });
        setPreviewFile(null);
        return;
      }
      setPreviewFile({ name: file.name, src: result.url, externalUrl: file.webUrl });
    });
  }

  const filtered = useMemo(() => docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())), [docs, query]);

  const canvasByCourse = useMemo(() => {
    const groups = new Map<string, CanvasCourseMaterial[]>();
    for (const material of canvasMaterials) {
      const list = groups.get(material.courseName) ?? [];
      list.push(material);
      groups.set(material.courseName, list);
    }
    return [...groups.entries()];
  }, [canvasMaterials]);

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "document", filename: file.name, sizeBytes: file.size }),
      });
      const signed = await signRes.json();
      if (!signRes.ok) throw new Error(signed.error ?? "Could not start upload.");

      const putRes = await fetch(signed.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      const confirmRes = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "document",
          storagePath: signed.storagePath,
          originalFilename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
      const confirmed = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmed.error ?? "Could not record upload.");

      const form = new FormData();
      form.set("name", file.name);
      form.set("uploadedFileId", confirmed.id);
      form.set("mimeType", file.type || "application/octet-stream");
      form.set("sizeBytes", String(file.size));
      form.set("visibility", "internal");
      const result = await createDocumentAction({}, form);
      if (result.error || !result.id) throw new Error(result.error ?? "Something went wrong.");

      setDocs((prev) => [
        {
          id: result.id!,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          uploadedById: null,
          uploadedByName: "You",
          visibility: "internal",
          createdAt: new Date(),
        },
        ...prev,
      ]);
      showToast({ title: "Document uploaded", description: `${file.name} was added to Documents.` });
    } catch (err) {
      showToast({ title: "Upload failed", description: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setUploading(false);
    }
  }

  function toggleVisibility(doc: DocumentRow) {
    const next = doc.visibility === "internal" ? "shared_with_client" : "internal";
    startTransition(async () => {
      const form = new FormData();
      form.set("documentId", doc.id);
      form.set("visibility", next);
      const result = await setDocumentVisibilityAction({}, form);
      if (result.error) {
        showToast({ title: "Couldn't update visibility", description: result.error });
        return;
      }
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, visibility: next } : d)));
      setSelected((prev) => (prev && prev.id === doc.id ? { ...prev, visibility: next } : prev));
    });
  }

  function handleDelete(doc: DocumentRow) {
    startTransition(async () => {
      const form = new FormData();
      form.set("documentId", doc.id);
      const result = await deleteDocumentAction({}, form);
      if (result.error) {
        showToast({ title: "Couldn't delete document", description: result.error });
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setSelected(null);
      showToast({ title: "Document deleted" });
    });
  }

  const columns: Column<DocumentRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <FileText size={16} className="flex-shrink-0 text-ink-3" />
          <span className="truncate font-medium text-ink-1">{d.name}</span>
        </div>
      ),
    },
    { key: "size", header: "Size", render: (d) => formatSize(d.sizeBytes) },
    { key: "uploadedBy", header: "Uploaded By", render: (d) => d.uploadedByName ?? "—" },
    { key: "date", header: "Date", render: (d) => new Date(d.createdAt).toLocaleDateString() },
    {
      key: "visibility",
      header: "Visibility",
      render: (d) => (
        <Badge tone={d.visibility === "shared_with_client" ? "accent" : "neutral"}>
          {d.visibility === "shared_with_client" ? sharedLabel : "Internal"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Documents</h1>
          <p className="mt-1 text-[14px] text-ink-2">Your workspace&apos;s files, private by default.</p>
        </div>
        <Button variant="primary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search documents…" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" description="Upload your first file to get started." />
        ) : (
          <DataTable columns={columns} rows={filtered} rowKey={(d) => d.id} onRowClick={setSelected} />
        )}
      </div>

      {oneDriveConnected ? (
        <div className="mt-8">
          <div className="mb-3">
            <h2 className="text-[16px] font-semibold text-ink-1">Microsoft OneDrive</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">Files stay in OneDrive and open there; 3Stone One does not duplicate their contents.</p>
          </div>
          {oneDriveFiles === null ? (
            <Card className="p-4 text-[13px] text-ink-2">Reconnect Microsoft in Integrations to approve OneDrive access.</Card>
          ) : oneDriveFiles.length === 0 ? (
            <Card className="p-4 text-[13px] text-ink-3">No files found at the root of this OneDrive.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {oneDriveFiles.map((file) => (
                <button key={file.id} onClick={() => previewOneDriveFile(file)} className="rounded-xl border border-line bg-surface p-3 text-left hover:bg-surface-raised">
                  <p className="truncate text-[13.5px] font-semibold text-ink-1">{file.name}</p>
                  <p className="mt-1 text-[11.5px] text-ink-3">{formatSize(file.sizeBytes)}{file.modifiedAt ? ` · Updated ${new Date(file.modifiedAt).toLocaleDateString()}` : ""}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {googleDriveConnected ? (
        <div className="mt-8">
          <div className="mb-3"><h2 className="text-[16px] font-semibold text-ink-1">Google Drive</h2><p className="mt-0.5 text-[12.5px] text-ink-3">Files stay in Drive and open there; 3Stone One does not duplicate their contents.</p></div>
          {googleDriveFiles === null ? <Card className="p-4 text-[13px] text-ink-2">Reconnect Google in Integrations to approve Drive access.</Card> : googleDriveFiles.length === 0 ? <Card className="p-4 text-[13px] text-ink-3">No accessible Google Drive files found.</Card> : <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{googleDriveFiles.map((file) => <button key={file.id} onClick={() => previewGoogleDriveFile(file)} className="rounded-xl border border-line bg-surface p-3 text-left hover:bg-surface-raised"><p className="truncate text-[13.5px] font-semibold text-ink-1">{file.name}</p><p className="mt-1 text-[11.5px] text-ink-3">{file.sizeBytes ? formatSize(file.sizeBytes) : file.mimeType}{file.modifiedAt ? ` · Updated ${new Date(file.modifiedAt).toLocaleDateString()}` : ""}</p></button>)}</div>}
        </div>
      ) : null}

      {canvasConnected ? (
        <div className="mt-8">
          <div className="mb-3">
            <h2 className="text-[16px] font-semibold text-ink-1">Canvas course materials</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">Files stay in Canvas and open there; 3Stone One does not duplicate their contents.</p>
          </div>
          {canvasByCourse.length === 0 ? (
            <Card className="p-4 text-[13px] text-ink-3">No files found in your active Canvas courses.</Card>
          ) : (
            <div className="flex flex-col gap-4">
              {canvasByCourse.map(([courseName, files]) => (
                <div key={courseName}>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink-2">{courseName}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {files.map((file) => (
                      <button key={file.fileId} onClick={() => previewCanvasFile(file)} className="rounded-xl border border-line bg-surface p-3 text-left hover:bg-surface-raised">
                        <p className="truncate text-[13.5px] font-semibold text-ink-1">{file.displayName}</p>
                        <p className="mt-1 text-[11.5px] text-ink-3">{formatSize(file.sizeBytes)} · Updated {new Date(file.updatedAt).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <DetailPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? formatSize(selected.sizeBytes) : ""}
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 text-[13.5px] text-ink-2">
              <p>Uploaded by {selected.uploadedByName ?? "someone no longer on this workspace"} on {new Date(selected.createdAt).toLocaleDateString()}</p>
              <p>
                {selected.visibility === "shared_with_client"
                  ? editionKey === "student"
                    ? `${sharedLabel} externally.`
                    : `${sharedLabel} via the Client Portal.`
                  : "Internal only."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/uploads/${selected.id}/download`}
                className="inline-flex h-9 items-center rounded-[10px] border border-line-strong px-3.5 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
              >
                Download
              </a>
              <Button variant="secondary" disabled={isPending} onClick={() => toggleVisibility(selected)}>
                {selected.visibility === "shared_with_client" ? "Make internal" : shareActionLabel}
              </Button>
              <Button variant="secondary" disabled={isPending} onClick={() => handleDelete(selected)}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => askAboutFile(selected.name)}>
                Ask 3Stone AI
              </Button>
            </div>
          </div>
        ) : null}
      </DetailPanel>

      <DetailPanel open={!!previewFile} onClose={() => setPreviewFile(null)} title={previewFile?.name ?? ""}>
        {previewLoading ? (
          <p className="text-[13.5px] text-ink-3">Loading preview…</p>
        ) : previewFile?.src ? (
          <div className="flex flex-col gap-3">
            <iframe src={previewFile.src} title={previewFile.name} className="h-[70vh] w-full rounded-[10px] border border-line" />
            <a href={previewFile.externalUrl} target="_blank" rel="noreferrer" className="w-fit text-[12.5px] font-medium text-accent hover:underline">
              Open in the original app instead
            </a>
            <Button variant="secondary" onClick={() => askAboutFile(previewFile.name)} className="w-fit">
              Ask 3Stone AI about this file
            </Button>
          </div>
        ) : null}
      </DetailPanel>
    </div>
  );
}

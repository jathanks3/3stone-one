"use client";

import { useRef, useState } from "react";

// Direct-to-storage upload: PUTs straight to the signed URL Supabase
// returns (no SDK, no key, ever sent to the browser — the URL itself
// carries a one-time upload token) — then tells our own server it's
// done via /api/uploads/confirm, which is what actually writes the Neon
// metadata row and (for avatar/logo) persists the resulting public URL.
// No hidden form field to wire up: confirm already saves directly, so
// this component doesn't depend on being inside any particular form.
export function FileUploadField({
  kind,
  currentUrl,
  label,
  onUploaded,
}: {
  kind: "avatar" | "logo";
  currentUrl: string | null;
  label: string;
  onUploaded?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, filename: file.name }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error ?? "Could not start upload.");

      const putRes = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      const confirmRes = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          storagePath: signData.storagePath,
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error ?? "Could not save upload.");

      setPreview(confirmData.publicUrl);
      onUploaded?.(confirmData.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-12 w-12 rounded-full border border-line object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-raised text-[11px] text-ink-3">
            None
          </div>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="h-9 rounded-[8px] border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink-1 hover:bg-surface-raised disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error ? <p className="text-[11.5px] text-critical">{error}</p> : null}
    </div>
  );
}

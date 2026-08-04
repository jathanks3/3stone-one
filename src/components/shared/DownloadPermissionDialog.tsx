"use client";

import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/ui/Button";

export type PendingDownload = { url: string; filename: string };

export const DOWNLOAD_PERMISSION_KEY = "3stone-downloads-allowed-until";

export function downloadsAllowedToday(): boolean {
  if (typeof window === "undefined") return false;
  return Number(window.localStorage.getItem(DOWNLOAD_PERMISSION_KEY) ?? 0) > Date.now();
}

export function startBrowserDownload(download: PendingDownload) {
  const link = document.createElement("a");
  link.href = download.url;
  link.download = download.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function DownloadPermissionDialog({ pending, onClose, onAllow }: {
  pending: PendingDownload | null;
  onClose: () => void;
  onAllow: (duration: "once" | "today") => void;
}) {
  if (!pending) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="download-permission-title">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><ShieldCheck size={19} /></div>
          <div>
            <h2 id="download-permission-title" className="text-[16px] font-semibold text-ink-1">Allow this download?</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">3Stone One will never download a document without your choice. You can approve just this file or skip prompts for the rest of today.</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-surface p-3">
          <p className="truncate text-[13px] font-medium text-ink-1"><Download size={14} className="mr-2 inline" />{pending.filename}</p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => onAllow("once")}>Allow this file</Button>
          <Button variant="primary" onClick={() => onAllow("today")}>Allow for today</Button>
        </div>
      </div>
    </div>
  );
}

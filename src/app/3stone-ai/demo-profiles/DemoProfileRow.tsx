"use client";

import { useState, useTransition } from "react";
import { deleteDemoProfileAction } from "./actions";
import type { DemoProfileRow as DemoProfileRowData } from "@/server/services/demoProfileService";

export function DemoProfileRow({ profile }: { profile: DemoProfileRowData }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function copyLink() {
    const url = `${window.location.origin}/demo?edition=${profile.editionKey}&profile=${profile.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${profile.label}"? This can't be undone.`)) return;
    startTransition(() => deleteDemoProfileAction(profile.id));
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-2.5 font-medium text-ink-1">{profile.label}</td>
      <td className="px-4 py-2.5 text-ink-2 capitalize">{profile.editionKey}</td>
      <td className="px-4 py-2.5 text-ink-2">{profile.orgName}</td>
      <td className="px-4 py-2.5 text-ink-2 capitalize">{profile.industryProfileKey}</td>
      <td className="px-4 py-2.5 text-ink-2 capitalize">{profile.accentColor ?? "Default"}</td>
      <td className="px-4 py-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-[7px] border border-line-strong px-2.5 py-1 text-[12px] font-semibold text-ink-1 hover:bg-surface-raised"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-[7px] border border-line-strong px-2.5 py-1 text-[12px] font-semibold text-critical hover:bg-surface-raised disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

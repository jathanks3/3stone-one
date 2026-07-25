"use client";

import { useState, useTransition } from "react";
import { togglePublishAction, deleteAnnouncementAction } from "./actions";

export function AnnouncementRow({
  id,
  title,
  body,
  publishedAt,
}: {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
}) {
  const [published, setPublished] = useState(Boolean(publishedAt));
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (deleted) return null;

  return (
    <div className="rounded-[12px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-ink-1">{title}</h3>
          <p className="mt-1 text-[13px] text-ink-2">{body}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            published ? "bg-good-wash text-good" : "bg-line text-ink-3"
          }`}
        >
          {published ? "Published" : "Draft"}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await togglePublishAction(id, !published);
              setPublished(!published);
            })
          }
          className="h-8 rounded-[8px] border border-line-strong px-3 text-[12.5px] font-medium text-ink-1 hover:bg-surface-raised disabled:opacity-60"
        >
          {published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteAnnouncementAction(id);
              setDeleted(true);
            })
          }
          className="h-8 rounded-[8px] border border-line-strong px-3 text-[12.5px] font-medium text-critical hover:bg-critical-wash disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

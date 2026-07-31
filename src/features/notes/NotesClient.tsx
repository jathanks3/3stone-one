"use client";

import { useRef, useState } from "react";
import { Pin, Plus, StickyNote, Trash2 } from "lucide-react";
import { Card } from "@/ui/Card";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { cn } from "@/lib/utils";
import { useIndustry } from "@/lib/industry";
import { DEMO_NOTES, STUDENT_NOTES } from "@/server/mock-data/notes";
import type { Note } from "@/types";

export function NotesClient() {
  const { editionKey } = useIndustry();
  const seed = editionKey === "student" ? STUDENT_NOTES : DEMO_NOTES;
  const [notes, setNotes] = useState<Note[]>(seed);
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const nextId = useRef(seed.length);

  const editing = openId && openId !== "new" ? notes.find((n) => n.id === openId) ?? null : null;

  function openNew() {
    setTitle("");
    setBody("");
    setOpenId("new");
  }

  function openExisting(note: Note) {
    setTitle(note.title);
    setBody(note.body);
    setOpenId(note.id);
  }

  function save() {
    if (!title.trim()) return;
    if (openId === "new") {
      nextId.current += 1;
      setNotes((prev) => [{ id: `local_${nextId.current}`, title: title.trim(), body: body.trim(), updatedAt: "Just now" }, ...prev]);
    } else if (openId) {
      setNotes((prev) => prev.map((n) => (n.id === openId ? { ...n, title: title.trim(), body: body.trim(), updatedAt: "Just now" } : n)));
    }
    setOpenId(null);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setOpenId(null);
  }

  function togglePin(id: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }

  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-ink-1">Notes</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            {editionKey === "student" ? "Quick thoughts, study notes, and drafts — yours alone." : "Quick notes and drafts, separate from your shared Documents."}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90"
        >
          <Plus size={15} />
          New note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={StickyNote} title="No notes yet" description="Jot down your first note to get started." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {[...pinned, ...rest].map((note) => (
            <Card
              key={note.id}
              onClick={() => openExisting(note)}
              className={cn(
                "flex cursor-pointer flex-col gap-2 border-l-[3px] p-4 transition-colors hover:bg-surface-raised",
                note.pinned ? "border-l-accent" : "border-l-line-strong"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[14px] font-semibold text-ink-1">{note.title}</p>
                {note.pinned ? <Pin size={13} className="mt-0.5 flex-shrink-0 fill-accent text-accent" /> : null}
              </div>
              <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-ink-2">{note.body}</p>
              <p className="text-[11.5px] text-ink-3">{note.updatedAt}</p>
            </Card>
          ))}
        </div>
      )}

      <DetailPanel
        open={openId !== null}
        onClose={() => setOpenId(null)}
        title={openId === "new" ? "New note" : "Edit note"}
      >
        <div className="flex flex-col gap-4">
          <label className="text-[12.5px] font-medium text-ink-2">
            Title
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="mt-1 h-10 w-full rounded-[9px] border border-line-strong bg-bg px-3 text-[14px] text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <label className="text-[12.5px] font-medium text-ink-2">
            Note
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write something..."
              className="mt-1 w-full resize-none rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13.5px] leading-relaxed text-ink-1 outline-none focus:border-accent"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90"
              >
                Save
              </button>
              {editing ? (
                <button
                  onClick={() => togglePin(editing.id)}
                  className="flex h-9 items-center gap-1.5 rounded-[9px] border border-line-strong px-3 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
                >
                  <Pin size={14} className={editing.pinned ? "fill-accent text-accent" : undefined} />
                  {editing.pinned ? "Unpin" : "Pin"}
                </button>
              ) : null}
            </div>
            {editing ? (
              <button
                onClick={() => deleteNote(editing.id)}
                aria-label="Delete note"
                className="flex h-9 w-9 items-center justify-center rounded-[9px] text-ink-3 hover:bg-critical-wash hover:text-critical"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </DetailPanel>
    </div>
  );
}

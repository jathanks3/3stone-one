"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Pin, Plus, StickyNote, Trash2 } from "lucide-react";
import { Card } from "@/ui/Card";
import { DetailPanel } from "@/ui/DetailPanel";
import { EmptyState } from "@/ui/EmptyState";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/download";
import { useToast } from "@/lib/toast";
import { useIndustry } from "@/lib/industry";
import {
  createNoteAction,
  deleteNoteAction,
  togglePinNoteAction,
  updateNoteAction,
} from "@/app/(app)/notes/actions";
import type { NoteRow } from "@/server/services/noteService";
import { VoiceCaptureButton } from "@/components/shared/VoiceCapture";

function exportNoteAsText(note: NoteRow) {
  downloadTextFile(`${note.title.replace(/[^\w-]+/g, "_") || "note"}.txt`, `${note.title}\n\n${note.body}`, "text/plain");
}

function exportAllNotesAsText(notes: NoteRow[]) {
  const content = notes.map((n) => `${n.title}\n${"-".repeat(n.title.length)}\n${n.body}`).join("\n\n\n");
  downloadTextFile("notes.txt", content, "text/plain");
}

function formatUpdatedAt(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RealNotesClient({ initialNotes }: { initialNotes: NoteRow[] }) {
  const { editionKey } = useIndustry();
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const savingRef = useRef(false);
  const { showToast } = useToast();

  const editing = openId && openId !== "new" ? notes.find((n) => n.id === openId) ?? null : null;

  function openNew() {
    setTitle("");
    setBody("");
    setOpenId("new");
  }

  function openExisting(note: NoteRow) {
    setTitle(note.title);
    setBody(note.body);
    setOpenId(note.id);
  }

  function save() {
    if (!title.trim() || savingRef.current) return;
    savingRef.current = true;
    startTransition(async () => {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("body", body.trim());
      if (openId === "new") {
        const result = await createNoteAction({}, form);
        savingRef.current = false;
        if (result.error || !result.id) return showToast({ title: "Couldn't save note", description: result.error ?? "Something went wrong." });
        setNotes((prev) => [
          { id: result.id!, title: title.trim(), body: body.trim(), pinned: false, updatedAt: new Date() },
          ...prev,
        ]);
      } else if (openId) {
        form.set("noteId", openId);
        const result = await updateNoteAction({}, form);
        savingRef.current = false;
        if (result.error) return showToast({ title: "Couldn't save note", description: result.error });
        setNotes((prev) =>
          prev.map((n) => (n.id === openId ? { ...n, title: title.trim(), body: body.trim(), updatedAt: new Date() } : n))
        );
      }
      setOpenId(null);
    });
  }

  function deleteNoteLocal(id: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set("noteId", id);
      const result = await deleteNoteAction({}, form);
      if (result.error) return showToast({ title: "Couldn't delete note", description: result.error });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setOpenId(null);
    });
  }

  function togglePin(id: string) {
    startTransition(async () => {
      const form = new FormData();
      form.set("noteId", id);
      const result = await togglePinNoteAction({}, form);
      if (result.error) return showToast({ title: "Couldn't update note", description: result.error });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
    });
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
        <div className="flex flex-shrink-0 items-center gap-2">
          {notes.length > 0 ? (
            <button
              onClick={() => exportAllNotesAsText(notes)}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong px-3 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
            >
              <Download size={15} />
              Export all
            </button>
          ) : null}
          <button
            onClick={openNew}
            className="flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent hover:opacity-90"
          >
            <Plus size={15} />
            New note
          </button>
        </div>
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
              <p className="text-[11.5px] text-ink-3">{formatUpdatedAt(note.updatedAt)}</p>
            </Card>
          ))}
        </div>
      )}

      <DetailPanel open={openId !== null} onClose={() => setOpenId(null)} title={openId === "new" ? "New note" : "Edit note"}>
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
          <VoiceCaptureButton label="Dictate note" onTranscript={(text) => setBody((current) => [current.trim(), text].filter(Boolean).join(current.trim() ? "\n\n" : ""))} className="w-fit" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={isPending}
                className="h-9 rounded-[9px] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
              >
                Save
              </button>
              {editing ? (
                <button
                  onClick={() => togglePin(editing.id)}
                  disabled={isPending}
                  className="flex h-9 items-center gap-1.5 rounded-[9px] border border-line-strong px-3 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
                >
                  <Pin size={14} className={editing.pinned ? "fill-accent text-accent" : undefined} />
                  {editing.pinned ? "Unpin" : "Pin"}
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {editing ? (
                <button
                  onClick={() => exportNoteAsText(editing)}
                  aria-label="Download this note as a text file"
                  className="flex h-9 w-9 items-center justify-center rounded-[9px] text-ink-3 hover:bg-surface-raised hover:text-ink-1"
                >
                  <Download size={16} />
                </button>
              ) : null}
              {editing ? (
                <button
                  onClick={() => deleteNoteLocal(editing.id)}
                  disabled={isPending}
                  aria-label="Delete note"
                  className="flex h-9 w-9 items-center justify-center rounded-[9px] text-ink-3 hover:bg-critical-wash hover:text-critical"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </DetailPanel>
    </div>
  );
}

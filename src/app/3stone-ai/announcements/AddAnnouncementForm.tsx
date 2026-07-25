"use client";

import { useActionState, useRef, useEffect } from "react";
import { addAnnouncementAction, type AddAnnouncementFormState } from "./actions";

const initialState: AddAnnouncementFormState = {};

export function AddAnnouncementForm() {
  const [state, formAction, pending] = useActionState(addAnnouncementAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-[12px] font-medium text-ink-2">Title</label>
        <input
          id="title"
          name="title"
          required
          placeholder="Scheduled maintenance tonight"
          className="h-9 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-[12px] font-medium text-ink-2">Body</label>
        <textarea
          id="body"
          name="body"
          required
          rows={2}
          className="rounded-[8px] border border-line-strong bg-bg px-2.5 py-2 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 w-fit rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add announcement"}
      </button>
      {state.error ? <p className="text-[12.5px] text-critical">{state.error}</p> : null}
    </form>
  );
}

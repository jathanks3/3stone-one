"use client";

import { useActionState, useRef, useEffect } from "react";
import { addFeatureFlagAction, type AddFeatureFlagFormState } from "./actions";

const initialState: AddFeatureFlagFormState = {};

export function AddFeatureFlagForm() {
  const [state, formAction, pending] = useActionState(addFeatureFlagAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 rounded-[12px] border border-line bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="key" className="text-[12px] font-medium text-ink-2">Key</label>
        <input
          id="key"
          name="key"
          required
          placeholder="ai_assistant_enabled"
          className="h-9 w-52 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="label" className="text-[12px] font-medium text-ink-2">Label</label>
        <input
          id="label"
          name="label"
          required
          placeholder="AI Assistant"
          className="h-9 w-48 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-[12px] font-medium text-ink-2">Description (optional)</label>
        <input
          id="description"
          name="description"
          className="h-9 w-64 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add flag"}
      </button>
      {state.error ? <p className="basis-full text-[12.5px] text-critical">{state.error}</p> : null}
    </form>
  );
}

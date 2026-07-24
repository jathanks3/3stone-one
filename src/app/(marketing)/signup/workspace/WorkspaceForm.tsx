"use client";

import { useActionState } from "react";
import { createWorkspaceAction, type WorkspaceFormState } from "./actions";

const initialState: WorkspaceFormState = {};

export function WorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspaceAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-[13px] font-medium text-ink-2">
          Workspace URL
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          placeholder="your-business-name"
          className="h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[14.5px] text-ink-1 placeholder:text-ink-3 outline-none transition-colors focus:border-accent"
        />
        <p className="text-[12px] text-ink-3">You can change this later. Letters, numbers, and dashes only.</p>
      </div>
      {state.error ? (
        <p role="alert" className="text-[13px] text-critical">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 rounded-[10px] bg-accent text-[14.5px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Continue"}
      </button>
    </form>
  );
}

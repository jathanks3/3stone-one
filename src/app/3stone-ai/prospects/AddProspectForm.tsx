"use client";

import { useActionState, useRef, useEffect } from "react";
import { addProspectAction, type AddProspectFormState } from "./actions";

const initialState: AddProspectFormState = {};

export function AddProspectForm() {
  const [state, formAction, pending] = useActionState(addProspectAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 rounded-[12px] border border-line bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-[12px] font-medium text-ink-2">Name</label>
        <input id="name" name="name" required className="h-9 w-40 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-[12px] font-medium text-ink-2">Email</label>
        <input id="email" name="email" type="email" required className="h-9 w-48 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="businessName" className="text-[12px] font-medium text-ink-2">Business (optional)</label>
        <input id="businessName" name="businessName" className="h-9 w-44 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent" />
      </div>
      <button type="submit" disabled={pending} className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60">
        {pending ? "Adding…" : "Add prospect"}
      </button>
      {state.error ? <p className="basis-full text-[12.5px] text-critical">{state.error}</p> : null}
    </form>
  );
}

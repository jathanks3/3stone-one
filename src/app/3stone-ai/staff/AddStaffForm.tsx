"use client";

import { useActionState, useRef, useEffect } from "react";
import { addStaffAction, type AddStaffFormState } from "./actions";

const initialState: AddStaffFormState = {};

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState(addStaffAction, initialState);
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
        <input id="email" name="email" type="email" required className="h-9 w-56 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-[12px] font-medium text-ink-2">Role</label>
        <select id="role" name="role" required className="h-9 w-36 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent">
          <option value="operations">Operations</option>
          <option value="support">Support</option>
          <option value="founder">Founder</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="h-9 rounded-[8px] bg-accent px-3.5 text-[13px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60">
        {pending ? "Adding…" : "Grant access"}
      </button>
      {state.error ? <p className="basis-full text-[12.5px] text-critical">{state.error}</p> : null}
      <p className="basis-full text-[12px] text-ink-3">
        No password is set — they sign in for the first time via "Forgot password" at /login.
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { setBusinessInfoAction, type BusinessInfoFormState } from "./actions";

const initialState: BusinessInfoFormState = {};

export function BusinessInfoForm() {
  const [state, formAction, pending] = useActionState(setBusinessInfoAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessName" className="text-[13px] font-medium text-ink-2">
          Business name
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          placeholder="Acme Construction"
          className="h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[14.5px] text-ink-1 placeholder:text-ink-3 outline-none transition-colors focus:border-accent"
        />
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
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

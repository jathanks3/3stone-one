"use client";

import { useActionState } from "react";
import { selectIndustryAction, type IndustryFormState } from "./actions";
import type { IndustryProfile } from "@/types";

const initialState: IndustryFormState = {};

export function IndustryForm({ profiles }: { profiles: IndustryProfile[] }) {
  const [state, formAction, pending] = useActionState(selectIndustryAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {profiles.map((p, i) => (
          <label
            key={p.key}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3.5 py-2.5 text-[13.5px] text-ink-1 transition-colors hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent-wash"
          >
            <input
              type="radio"
              name="industryProfileKey"
              value={p.key}
              defaultChecked={i === 0}
              className="accent-accent"
              required
            />
            {p.label}
          </label>
        ))}
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

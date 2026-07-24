"use client";

import { useActionState } from "react";
import { Check, Lock } from "lucide-react";
import { selectPlanAction, type PlanFormState } from "./actions";

const initialState: PlanFormState = {};

export function PlanForm() {
  const [state, formAction, pending] = useActionState(selectPlanAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-[10px] border border-accent bg-accent-wash px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-accent">
              <Check size={14} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink-1">Free</p>
              <p className="text-[12px] text-ink-3">Everything you need to get started</p>
            </div>
          </div>
        </div>

        {["Pro", "Enterprise"].map((tier) => (
          <div key={tier} className="flex items-center justify-between rounded-[10px] border border-line-strong bg-surface px-4 py-3 opacity-60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-ink-3">
                <Lock size={13} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink-1">{tier}</p>
                <p className="text-[12px] text-ink-3">Not available yet — you&rsquo;re on Free for now</p>
              </div>
            </div>
          </div>
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
        {pending ? "Saving…" : "Continue with Free"}
      </button>
    </form>
  );
}

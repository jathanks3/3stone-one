"use client";

import { useActionState } from "react";
import { Check, Lock } from "lucide-react";
import { selectPlanAction, type PlanFormState } from "./actions";
import { getPlanTiersForEdition, ENTERPRISE_LABEL } from "@/config/pricing";

const initialState: PlanFormState = {};

export function PlanForm({ editionKey }: { editionKey: string }) {
  const [state, formAction, pending] = useActionState(selectPlanAction, initialState);
  const tiers = getPlanTiersForEdition(editionKey);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center justify-between rounded-[10px] border border-line-strong bg-surface px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-wash">
          <div className="flex items-center gap-2.5">
            <input type="radio" name="plan" value="free" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
            <div>
              <p className="text-[14px] font-semibold text-ink-1">Free</p>
              <p className="text-[12px] text-ink-3">1 seat · 20 AI actions · explore before upgrading</p>
            </div>
          </div>
        </label>

        {tiers.map((tier) => (
          <label key={tier.key} className="flex cursor-pointer items-center justify-between rounded-[10px] border border-line-strong bg-surface px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-wash">
            <div className="flex items-center gap-2.5">
              <input type="radio" name="plan" value={tier.key} className="h-4 w-4 accent-[var(--accent)]" />
              <div>
                <p className="text-[14px] font-semibold text-ink-1">
                  {tier.label} — ${tier.priceMonthly}/mo
                </p>
                <p className="text-[12px] text-ink-3">14-day trial · card required · cancel anytime</p>
              </div>
            </div>
            <Check size={15} className="text-accent" />
          </label>
        ))}
        <div className="flex items-center justify-between rounded-[10px] border border-line-strong bg-surface px-4 py-3 opacity-60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-ink-3">
              <Lock size={13} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink-1">{ENTERPRISE_LABEL}</p>
              <p className="text-[12px] text-ink-3">Custom — talk to us</p>
            </div>
          </div>
        </div>
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

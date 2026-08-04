"use client";

import { useActionState, useState } from "react";
import { Check, Lock } from "lucide-react";
import { selectPlanAction, type PlanFormState } from "./actions";
import { getPlanTiersForEdition, ENTERPRISE_LABEL, monthlyPriceForSeats, wholesaleAnnualPrice } from "@/config/pricing";

const initialState: PlanFormState = {};

export function PlanForm({ editionKey, wholesaleAnnual = false }: { editionKey: string; wholesaleAnnual?: boolean }) {
  const [state, formAction, pending] = useActionState(selectPlanAction, initialState);
  const tiers = getPlanTiersForEdition(editionKey);
  const [seatCount, setSeatCount] = useState(1);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="seatCount" value={seatCount} />
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center justify-between rounded-[10px] border border-line-strong bg-surface px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-wash">
          <div className="flex items-center gap-2.5">
            <input type="radio" name="plan" value="free" defaultChecked={!wholesaleAnnual} className="h-4 w-4 accent-[var(--accent)]" />
            <div>
              <p className="text-[14px] font-semibold text-ink-1">Free</p>
              <p className="text-[12px] text-ink-3">1 seat · 20 AI actions · explore before upgrading</p>
            </div>
          </div>
        </label>

        {tiers.map((tier) => (
          <label key={tier.key} className="flex cursor-pointer items-center justify-between rounded-[10px] border border-line-strong bg-surface px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-wash">
            <div className="flex items-center gap-2.5">
              <input type="radio" name="plan" value={tier.key} defaultChecked={wholesaleAnnual} className="h-4 w-4 accent-[var(--accent)]" />
              <div>
                <p className="text-[14px] font-semibold text-ink-1">
                  {wholesaleAnnual ? `${tier.label} Wholesale — $${wholesaleAnnualPrice(tier, seatCount)}/year` : `${tier.label} — $${monthlyPriceForSeats(tier, seatCount)}/mo`}
                </p>
                <p className="text-[12px] text-ink-3">{wholesaleAnnual ? "25% wholesale discount · billed annually" : "14-day trial · card required · cancel anytime"}</p>
              </div>
            </div>
            <Check size={15} className="text-accent" />
          </label>
        ))}
        <label className="rounded-[10px] border border-line-strong bg-surface px-4 py-3">
          <span className="block text-[14px] font-semibold text-ink-1">Seats</span>
          <span className="mt-0.5 block text-[12px] text-ink-3">The first seat is included. Each additional seat adds $5/month.</span>
          <input
            type="number"
            min={1}
            max={tiers[0]?.maxEmployees ?? 1}
            value={seatCount}
            onChange={(event) => setSeatCount(Math.max(1, Math.min(tiers[0]?.maxEmployees ?? 1, Number(event.target.value) || 1)))}
            className="mt-2 h-10 w-full rounded-[8px] border border-line-strong bg-surface-raised px-3 text-[14px] text-ink-1"
          />
        </label>
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

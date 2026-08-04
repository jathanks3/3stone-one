"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { selectEditionAction, type ProductFormState } from "./actions";

const initialState: ProductFormState = {};

const OPTIONS = [
  {
    key: "business",
    label: "3Stone One",
    detail: "The full operating system - CRM, projects, finance, inventory, automation, and analytics.",
  },
  {
    key: "workspace",
    label: "3Stone One Workspace",
    detail: "For day-to-day workers, CEOs, and managers - documents, projects, and meetings, without the back office.",
  },
  {
    key: "student",
    label: "3Stone One Student",
    detail: "Documents, projects, and study tools for coursework and group work - AI included.",
  },
] as const;

export function ProductForm({ initialEdition }: { initialEdition?: string }) {
  const [state, formAction, pending] = useActionState(selectEditionAction, initialState);
  const [selected, setSelected] = useState<string>(
    initialEdition === "workspace" || initialEdition === "student" ? initialEdition : "business"
  );
  const [isNonprofit, setIsNonprofit] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="editionKey" value={selected} />
      <input type="hidden" name="isNonprofit" value={isNonprofit ? "true" : "false"} />
      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelected(option.key)}
            className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors ${
              selected === option.key ? "border-accent bg-accent-wash" : "border-line-strong bg-surface hover:bg-surface-raised"
            }`}
          >
            <div
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                selected === option.key ? "bg-accent text-on-accent" : "bg-surface-raised text-ink-3"
              }`}
            >
              {selected === option.key ? <Check size={13} strokeWidth={3} /> : null}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink-1">{option.label}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{option.detail}</p>
            </div>
          </button>
        ))}
      </div>
      {selected === "workspace" ? (
        <label className="flex items-start gap-3 rounded-[10px] border border-line-strong bg-surface px-4 py-3 text-left">
          <input
            type="checkbox"
            checked={isNonprofit}
            onChange={(e) => setIsNonprofit(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
          />
          <span>
            <span className="block text-[14px] font-semibold text-ink-1">This is a nonprofit organization</span>
            <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-3">
              Switches the wording throughout to match nonprofit terminology - Programs, Constituents, Staff -
              instead of generic business terms.
            </span>
          </span>
        </label>
      ) : null}
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

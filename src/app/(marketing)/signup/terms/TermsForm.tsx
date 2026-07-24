"use client";

import { useActionState } from "react";
import { acceptTermsAction, type TermsFormState } from "./actions";

const initialState: TermsFormState = {};

export function TermsForm() {
  const [state, formAction, pending] = useActionState(acceptTermsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-start gap-2.5 rounded-[10px] border border-line-strong bg-surface px-3.5 py-3 text-[13.5px] text-ink-2">
        <input type="checkbox" name="accepted" className="mt-0.5 accent-accent" required />
        <span>
          I agree to the{" "}
          <a href="https://www.3stoneai.com/terms" target="_blank" rel="noreferrer" className="font-medium text-accent hover:text-accent-strong">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="https://www.3stoneai.com/privacy" target="_blank" rel="noreferrer" className="font-medium text-accent hover:text-accent-strong">
            Privacy Policy
          </a>
          .
        </span>
      </label>
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
        {pending ? "Finishing up…" : "Complete setup"}
      </button>
    </form>
  );
}

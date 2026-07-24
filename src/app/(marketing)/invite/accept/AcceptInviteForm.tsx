"use client";

import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteFormState } from "./actions";

const initialState: AcceptInviteFormState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-ink-2">
          Create a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          placeholder="At least 12 characters"
          className="h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[14.5px] text-ink-1 placeholder:text-ink-3 outline-none transition-colors focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-[13px] font-medium text-ink-2">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[14.5px] text-ink-1 outline-none transition-colors focus:border-accent"
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
        {pending ? "Joining…" : "Join workspace"}
      </button>
    </form>
  );
}

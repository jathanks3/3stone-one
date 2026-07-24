"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { signupAction, type SignupFormState } from "./actions";

const initialState: SignupFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  if (state.submittedEmail) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-wash text-accent">
          <MailCheck size={22} />
        </div>
        <p className="text-[14px] text-ink-2">
          We sent a verification link to <span className="font-semibold text-ink-1">{state.submittedEmail}</span>.
        </p>
        {state.devVerifyToken ? (
          <div className="mt-2 w-full rounded-[10px] border border-line-strong bg-surface p-3 text-left text-[12.5px] text-ink-3">
            <p className="font-semibold text-ink-2">Email delivery isn&rsquo;t configured yet.</p>
            <p className="mt-1">
              For now, continue with{" "}
              <a href={`/signup/verify?token=${state.devVerifyToken}`} className="font-medium text-accent hover:text-accent-strong">
                this verification link
              </a>
              .
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-ink-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
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
        {pending ? "Sending…" : "Continue"}
      </button>
      <p className="text-center text-[13px] text-ink-3">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-accent hover:text-accent-strong">
          Sign in
        </a>
      </p>
    </form>
  );
}

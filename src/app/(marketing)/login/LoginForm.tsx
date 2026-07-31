"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { loginAction, demoLoginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-[400px]">
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-ink-2">
              Password
            </label>
            <a href="/reset-password" className="text-[12.5px] font-medium text-accent hover:text-accent-strong">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="h-11 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[14.5px] text-ink-1 placeholder:text-ink-3 outline-none transition-colors focus:border-accent"
          />
        </div>

        {state?.error ? (
          <p role="alert" className="text-[13px] text-critical">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-11 rounded-[10px] bg-accent text-[14.5px] font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form action={demoLoginAction}>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-accent-wash-strong bg-accent-wash text-[14.5px] font-semibold text-accent transition-colors hover:bg-accent-wash-strong"
        >
          <Sparkles size={16} strokeWidth={2.25} />
          Try the Live Demo
        </button>
      </form>
      <p className="mt-2.5 text-center text-[12.5px] text-ink-3">
        Loads a fully populated demo account — no signup required.
      </p>

      <p className="mt-6 text-center text-[13px] text-ink-3">
        New to 3Stone One?{" "}
        <a href="/signup" className="font-medium text-accent hover:text-accent-strong">
          Create an account
        </a>
      </p>
    </div>
  );
}

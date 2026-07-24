import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

// Same dark-brand chrome as login/page.tsx and signup/SignupShell.tsx,
// without a step indicator — reset-password is a 2-screen flow (request,
// then confirm), not a wizard with a meaningful "step N of N" to show.
const DARK_BRAND_STYLE = {
  "--bg": "#050505",
  "--surface": "#0c0c0d",
  "--surface-raised": "#131314",
  "--line": "rgba(255, 255, 255, 0.08)",
  "--line-strong": "rgba(255, 255, 255, 0.14)",
  "--ink-1": "rgba(255, 255, 255, 0.94)",
  "--ink-2": "rgba(255, 255, 255, 0.62)",
  "--ink-3": "rgba(255, 255, 255, 0.48)",
  "--accent": "#6e93d6",
  "--accent-strong": "#8aabe3",
  "--accent-wash": "rgba(110, 147, 214, 0.1)",
  "--accent-wash-strong": "rgba(110, 147, 214, 0.16)",
  "--on-accent": "#050505",
  "--critical": "#e66767",
  "--shadow": "0 1px 2px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.4)",
} as CSSProperties;

export function ResetPasswordShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={DARK_BRAND_STYLE} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent opacity-[0.09] blur-[130px]"
      />
      <div className="relative flex w-full max-w-[420px] flex-col items-center">
        <Image src="/branding/monogram.svg" alt="" width={32} height={32} className="mb-6 opacity-95" />
        <h1 className="text-center text-[22px] font-extrabold tracking-tight text-ink-1">{title}</h1>
        {subtitle ? <p className="mb-8 mt-1.5 text-center text-[14px] text-ink-2">{subtitle}</p> : <div className="mb-8" />}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

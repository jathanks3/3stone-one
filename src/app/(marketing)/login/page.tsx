import Image from "next/image";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Blend, Sparkles, Users } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { MORNING_BRIEFING } from "@/server/mock-data";

export const metadata: Metadata = {
  title: "Sign in — 3Stone One",
};

// The login screen is the front door — it stays on the permanent dark
// brand treatment (like 3stoneai.com) regardless of the in-app light/dark
// preference, which only applies once someone is signed in. Overriding the
// theme tokens here (rather than the app's light/dark toggle) keeps every
// existing bg-*/text-*/border-* utility working unchanged.
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

const FEATURES = [
  {
    icon: Sparkles,
    title: "A morning briefing, generated for you",
    description: "See what needs attention before you even open the app.",
  },
  {
    icon: Blend,
    title: "Adapts to your business instantly",
    description: "Same product, your industry's terms — try it after you sign in.",
  },
  {
    icon: Users,
    title: "Everything in one place",
    description: "CRM, projects, finance, and your team — no more switching tabs.",
  },
];

export default function LoginPage() {
  return (
    <div
      style={DARK_BRAND_STYLE}
      className="relative flex min-h-screen overflow-hidden bg-bg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent opacity-[0.09] blur-[130px]"
      />

      {/* Showcase panel — hidden below lg, this is the "sell it before they're in" side */}
      <div className="relative hidden w-[46%] flex-col justify-between border-r border-line px-14 py-14 lg:flex xl:px-20">
        <div>
          <div className="mb-10 flex items-center gap-2.5">
            <Image src="/branding/monogram.svg" alt="" width={28} height={21} priority />
            <span className="text-[15px] font-bold text-ink-1">3Stone One</span>
          </div>
          <h1 className="max-w-[420px] text-[34px] font-extrabold leading-[1.15] tracking-tight text-ink-1 text-balance">
            Run your business from one screen.
          </h1>
          <p className="mt-4 max-w-[400px] text-[15px] leading-relaxed text-ink-2">
            CRM, projects, finance, and your team, in one place — without
            replacing the tools you already use.
          </p>

          <div className="mt-11 flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-wash text-accent">
                  <f.icon size={17} strokeWidth={1.9} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink-1">{f.title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-3">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-accent-wash-strong bg-accent-wash p-4">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={14} strokeWidth={2.25} />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Your morning briefing</p>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            {MORNING_BRIEFING.paragraph.split(".")[0]}.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-[400px] flex-col items-center">
          <Image
            src="/branding/monogram.svg"
            alt=""
            width={36}
            height={27}
            className="mb-6 opacity-95 lg:hidden"
            priority
          />
          <h2 className="text-[22px] font-extrabold tracking-tight text-ink-1 lg:text-[24px]">
            Sign in
          </h2>
          <p className="mb-9 mt-1.5 text-[14.5px] text-ink-2">One place to run your business.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FolderKanban, Calendar, Sparkles } from "lucide-react";
import { STUDENT_PLAN_TIERS, AI_ADD_ON_PRICE_MONTHLY } from "@/config/pricing";
import { TierGrid } from "@/components/marketing/TierGrid";

export const metadata: Metadata = { title: "3Stone One Student — coursework and group projects, in one place" };

// Dedicated marketing page for the Student edition - same dark-brand
// treatment as the homepage/pricing/login (DARK_BRAND_STYLE). Feature set
// drawn from the real allowed-module list (EDITION_MODULES.student in
// src/lib/editionModules.ts): dashboard, projects, meetings, documents,
// knowledge, activity, settings - no CRM/people/client-portal, since a
// student has no clients or team to manage.
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
} as CSSProperties;

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Coursework as real projects",
    detail: "Break assignments and group work into tasks with real due dates - not another notes app to keep in sync.",
  },
  {
    icon: Calendar,
    title: "Meetings and documents together",
    detail: "Study sessions and group meetings, plus the documents behind them, live in the same place.",
  },
  {
    icon: Sparkles,
    title: "AI assistant, as an add-on",
    detail: `Turn on real AI help for $${AI_ADD_ON_PRICE_MONTHLY}/month - outline an assignment, get feedback on writing, or plan out a project.`,
  },
];

export default function StudentMarketingPage() {
  return (
    <div style={DARK_BRAND_STYLE} className="relative min-h-screen overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent opacity-[0.09] blur-[130px]"
      />

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/branding/monogram.svg" alt="" width={28} height={21} priority />
          <span className="text-[15px] font-bold text-ink-1">3Stone One</span>
        </Link>
        <nav className="flex items-center gap-5 text-[13.5px] text-ink-2">
          <Link href="/pricing" className="hover:text-ink-1">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-ink-1">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-[10px] bg-accent px-4 font-semibold text-on-accent hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-24 pt-10 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">3Stone One Student</p>
        <h1 className="mt-3 text-balance text-[40px] font-extrabold leading-[1.1] tracking-tight text-ink-1 sm:text-[48px]">
          Coursework and group projects, in one place.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-ink-2">
          Built for college and grad school - documents, projects, and meetings for a semester or a whole
          program, with real AI help available as an add-on.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-[10px] bg-accent px-6 text-[14.5px] font-semibold text-on-accent hover:opacity-90"
          >
            Get started
          </Link>
          {/* Plain <a>, not Link - a client-side transition here can
              serve a cached /dashboard from before the session cookie
              changed (see HomePage.tsx for the full explanation). */}
          <a
            href="/demo?edition=student"
            className="inline-flex h-11 items-center rounded-[10px] border border-line-strong px-6 text-[14.5px] font-semibold text-ink-1 hover:bg-surface"
          >
            Try the live demo
          </a>
        </div>

        <div className="mt-20 grid gap-5 text-left sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[14px] border border-line bg-surface p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-wash text-accent">
                <f.icon size={18} strokeWidth={1.9} />
              </div>
              <p className="text-[14.5px] font-semibold text-ink-1">{f.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{f.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-left">
          <h2 className="text-center text-[24px] font-bold text-ink-1">Pricing</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-center text-[14px] text-ink-2">
            Priced from real cost-to-serve, same as every 3Stone One edition - see the{" "}
            <Link href="/pricing" className="text-accent hover:underline">
              full pricing page
            </Link>{" "}
            for a side-by-side with the other editions.
          </p>
          <div className="mt-8">
            <TierGrid tiers={STUDENT_PLAN_TIERS} signupHref="/signup" />
          </div>
        </div>
      </main>
    </div>
  );
}

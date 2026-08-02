import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { FolderKanban, Calendar, StickyNote, Sparkles, Calculator, Briefcase } from "lucide-react";
import { STUDENT_PLAN_TIERS } from "@/config/pricing";
import { AI_ACTIONS_INCLUDED_PER_CYCLE } from "@/config/usageCaps";
import { TierGrid } from "@/components/marketing/TierGrid";
import { StudentMark } from "@/components/shell/EditionMark";
import { SpotlightCards } from "@/components/marketing/SpotlightCards";

export const metadata: Metadata = {
  title: "3Stone One Student — coursework and group projects, in one place",
  alternates: { canonical: "/student" },
  openGraph: { title: "3Stone One Student — coursework and group projects, in one place", url: "/student", type: "website" },
};

// Dedicated marketing page for the Student edition. Accent is the same
// violet used in the real in-app sidebar for this edition (globals.css
// .edition-student) - this page used to run the flagship's blue, which
// meant the marketing page and the product itself disagreed about what
// "Student" looks like. Feature set drawn from the real allowed-module
// list (EDITION_MODULES.student in src/lib/editionModules.ts):
// dashboard, projects, calendar, documents, notes, gpa, knowledge,
// activity, settings - no CRM/people/client-portal (nothing here to
// manage a team or clients with) and no Meetings - a student doesn't
// run agendas/AI summaries the way a workplace does; Calendar covers
// classes/deadlines/study sessions instead.
const DARK_BRAND_STYLE = {
  "--bg": "#050505",
  "--surface": "#0c0c0d",
  "--surface-raised": "#131314",
  "--line": "rgba(255, 255, 255, 0.08)",
  "--line-strong": "rgba(255, 255, 255, 0.14)",
  "--ink-1": "rgba(255, 255, 255, 0.94)",
  "--ink-2": "rgba(255, 255, 255, 0.62)",
  "--ink-3": "rgba(255, 255, 255, 0.48)",
  "--accent": "#a594f5",
  "--accent-strong": "#b9adf7",
  "--accent-wash": "rgba(165, 148, 245, 0.1)",
  "--accent-wash-strong": "rgba(165, 148, 245, 0.16)",
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
    title: "A calendar that's actually yours",
    detail: "Add, move, and delete classes, deadlines, and study sessions - no meetings to run, just what's on your plate.",
  },
  {
    icon: StickyNote,
    title: "Quick notes, always at hand",
    detail: "Jot down a thought mid-lecture or outline an idea, kept separate from your shared documents.",
  },
  {
    icon: Calculator,
    title: "A real GPA calculator",
    detail: "Add your courses and grades - your cumulative GPA updates instantly, on the standard 4.0 scale.",
  },
  {
    icon: Briefcase,
    title: "An internship & job tracker",
    detail: "A real pipeline - saved, applied, interviewing, offer - not a spreadsheet you forget to update.",
  },
  {
    icon: Sparkles,
    title: "Real AI, included",
    detail: `${AI_ACTIONS_INCLUDED_PER_CYCLE} AI actions included every month, no add-on required - outline an assignment, get feedback on writing, or plan out a project.`,
  },
];

export default function StudentMarketingPage() {
  return (
    <div style={DARK_BRAND_STYLE} className="relative min-h-screen overflow-hidden bg-bg">
      <SpotlightCards />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 640px 420px at 15% 0%, rgba(165, 148, 245, 0.15), transparent 60%), radial-gradient(ellipse 520px 420px at 90% 25%, rgba(110, 147, 214, 0.06), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(to bottom, black, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)",
        }}
      />

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-2.5">
          <StudentMark size={26} />
          <span className="text-[15px] font-bold text-ink-1">3Stone One Student</span>
        </Link>
        <nav className="flex items-center gap-3 text-[13.5px] text-ink-2">
          <Link href="/pricing" className="mr-2 hover:text-ink-1">
            Pricing
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-[10px] border border-line-strong px-4 font-semibold text-ink-1 hover:bg-surface-raised"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-[10px] bg-accent px-4 font-semibold text-on-accent transition-transform hover:-translate-y-px hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-24 pt-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-wash-strong bg-accent-wash px-3 py-1 text-[12px] font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Live product
        </span>
        <h1 className="mt-5 text-balance text-[40px] font-extrabold leading-[1.08] tracking-tight text-ink-1 sm:text-[52px]">
          Coursework and group projects, in one place.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16.5px] leading-relaxed text-ink-2">
          Built for college and grad school - documents, projects, a real calendar, notes, and a GPA
          calculator for a semester or a whole program, with real AI help available as an add-on.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-[10px] bg-accent px-6 text-[14.5px] font-semibold text-on-accent transition-transform hover:-translate-y-px hover:opacity-90"
          >
            Get started
          </Link>
          {/* Plain <a>, not Link - a client-side transition here can
              serve a cached /dashboard from before the session cookie
              changed (see HomePage.tsx for the full explanation). */}
          <a
            href="/demo?edition=student"
            className="inline-flex h-11 items-center rounded-[10px] border border-line-strong px-6 text-[14.5px] font-semibold text-ink-1 transition-colors hover:bg-surface"
          >
            Try the live demo
          </a>
        </div>
        <p className="mt-6 text-[13px] text-ink-3">From $55/mo · self-serve signup, no call required</p>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="spotlight-card group rounded-[14px] border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-wash text-accent transition-colors group-hover:bg-accent-wash-strong">
                <f.icon size={18} strokeWidth={1.9} />
              </div>
              <p className="text-[14.5px] font-semibold text-ink-1">{f.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{f.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-left">
          <h2 className="text-center text-[26px] font-bold tracking-tight text-ink-1">Pricing</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-center text-[14px] text-ink-2">
            Priced from real cost-to-serve, same as every 3Stone One edition. Prefer to pick modules yourself?{" "}
            <a
              href="https://www.3stoneai.com/workspace/pricing"
              className="font-semibold text-accent hover:underline"
            >
              Build your own stack
            </a>
            .
          </p>
          <div className="mt-8">
            <TierGrid tiers={STUDENT_PLAN_TIERS} signupHref="/signup" />
          </div>
          <p className="mt-5 text-center text-[13px] text-ink-3">
            See the{" "}
            <Link href="/pricing" className="text-accent hover:underline">
              full pricing page
            </Link>{" "}
            for a side-by-side with every edition.
          </p>
        </div>
      </main>
    </div>
  );
}

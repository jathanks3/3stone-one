import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Users2, FolderKanban, MessagesSquare, Calendar, Plane } from "lucide-react";
import { WORKSPACE_PLAN_TIERS } from "@/config/pricing";
import { TierGrid } from "@/components/marketing/TierGrid";
import { WorkspaceMark } from "@/components/shell/EditionMark";
import { SpotlightCards } from "@/components/marketing/SpotlightCards";

export const metadata: Metadata = { title: "3Stone One Workspace — for day-to-day workers, CEOs, and managers" };

// Dedicated marketing page for the Workspace edition. Accent is the same
// teal used in the real in-app sidebar for this edition (globals.css
// .edition-workspace) - this page used to run the flagship's blue,
// which meant the marketing page and the product itself disagreed about
// what "Workspace" looks like. Feature set drawn from the real allowed-
// module list (EDITION_MODULES.workspace in src/lib/editionModules.ts),
// not invented copy.
const DARK_BRAND_STYLE = {
  "--bg": "#050505",
  "--surface": "#0c0c0d",
  "--surface-raised": "#131314",
  "--line": "rgba(255, 255, 255, 0.08)",
  "--line-strong": "rgba(255, 255, 255, 0.14)",
  "--ink-1": "rgba(255, 255, 255, 0.94)",
  "--ink-2": "rgba(255, 255, 255, 0.62)",
  "--ink-3": "rgba(255, 255, 255, 0.48)",
  "--accent": "#5cbf99",
  "--accent-strong": "#7ad1b0",
  "--accent-wash": "rgba(92, 191, 153, 0.1)",
  "--accent-wash-strong": "rgba(92, 191, 153, 0.16)",
  "--on-accent": "#050505",
} as CSSProperties;

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Projects and documents together",
    detail: "Track work and keep the files behind it in the same place - no back-and-forth between a project tool and a drive.",
  },
  {
    icon: Users2,
    title: "CRM, without the accounting",
    detail: "See customers and deals alongside your work - finance, inventory, and automation stay out, since managing them isn't your job.",
  },
  {
    icon: MessagesSquare,
    title: "Communications and meetings",
    detail: "Team chat, call notes, and meeting summaries live next to the work they're about, not in a separate app.",
  },
  {
    icon: Calendar,
    title: "A real calendar and a notes space",
    detail: "Add, move, and delete what's on the schedule, plus a lightweight notes space separate from shared documents.",
  },
  {
    icon: Plane,
    title: "Time off, request and approve",
    detail: "Submit a request, a manager approves or denies it - no spreadsheet or side channel required.",
  },
];

export default function WorkspaceMarketingPage() {
  return (
    <div style={DARK_BRAND_STYLE} className="relative min-h-screen overflow-hidden bg-bg">
      <SpotlightCards />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 640px 420px at 15% 0%, rgba(92, 191, 153, 0.14), transparent 60%), radial-gradient(ellipse 520px 420px at 90% 25%, rgba(110, 147, 214, 0.06), transparent 60%)",
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
          <WorkspaceMark size={26} />
          <span className="text-[15px] font-bold text-ink-1">3Stone One Workspace</span>
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
          Run your day, without the back office.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16.5px] leading-relaxed text-ink-2">
          Built for the day-to-day workers, CEOs, and managers who need customers, projects, and meetings in one
          place - not finance, inventory, or automation they&rsquo;ll never touch.
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
            href="/demo?edition=workspace"
            className="inline-flex h-11 items-center rounded-[10px] border border-line-strong px-6 text-[14.5px] font-semibold text-ink-1 transition-colors hover:bg-surface"
          >
            Try the live demo
          </a>
        </div>
        <p className="mt-6 text-[13px] text-ink-3">From $69/mo · self-serve signup, no call required</p>

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
            <TierGrid tiers={WORKSPACE_PLAN_TIERS} signupHref="/signup" />
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

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BarChart3, Building2, Sparkles } from "lucide-react";
import { SpotlightCards } from "@/components/marketing/SpotlightCards";

// Resting marketing page for logged-out visitors at "/" - previously this
// route redirected straight to /login with no context on what the product
// even is. Same dark-brand treatment as /login and /signup (see
// (marketing)/login/page.tsx and signup/SignupShell.tsx) for visual
// consistency across every public-facing surface.
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

// Colors match the real in-app per-edition accent (globals.css
// .edition-workspace/.edition-student) and the marketing pages at
// /workspace and /student - one visual identity per edition, not just
// on the page selling it.
const EDITIONS = [
  {
    id: "business",
    name: "3Stone One",
    tagline: "The full operating system - CRM, projects, finance, inventory, automation, and analytics.",
    fromPrice: 99,
    accent: "#6e93d6",
    demoHref: "/demo?edition=business",
    learnMoreHref: null,
  },
  {
    id: "workspace",
    name: "3Stone One Workspace",
    tagline: "For day-to-day workers, CEOs, and managers - documents, projects, meetings, and time off requests, without the back office.",
    fromPrice: 69,
    accent: "#5cbf99",
    demoHref: "/demo?edition=workspace",
    learnMoreHref: "/workspace",
  },
  {
    id: "student",
    name: "3Stone One Student",
    tagline: "Documents, projects, a calendar, notes, a GPA calculator, and a job tracker for coursework - AI available as a paid add-on.",
    fromPrice: 55,
    accent: "#a594f5",
    demoHref: "/demo?edition=student",
    learnMoreHref: "/student",
  },
] as const;

const PRINCIPLES = [
  {
    icon: Building2,
    title: "One screen, not six tools",
    detail: "CRM, projects, finance, and scheduling in one place - sitting on top of what you already use, not replacing it.",
  },
  {
    icon: Sparkles,
    title: "AI woven in, not bolted on",
    detail: "Every module gets AI assistance built for that specific job, not a chatbot pasted into a sidebar.",
  },
  {
    icon: BarChart3,
    title: "Relabels itself for your industry",
    detail: "\"Job,\" \"Case,\" or \"Location\" - the same system speaks your business's language from day one.",
  },
];

export default function HomePage() {
  return (
    <div style={DARK_BRAND_STYLE} className="relative min-h-screen overflow-hidden bg-bg">
      <SpotlightCards />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 640px 420px at 20% 0%, rgba(110, 147, 214, 0.15), transparent 60%), radial-gradient(ellipse 520px 420px at 88% 22%, rgba(47, 224, 168, 0.06), transparent 60%)",
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
        <div className="flex items-center gap-2.5">
          <Image src="/branding/monogram.svg" alt="" width={28} height={21} priority />
          <span className="text-[15px] font-bold text-ink-1">3Stone One</span>
        </div>
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
            className="inline-flex h-9 items-center rounded-[10px] bg-accent px-4 font-semibold text-on-accent hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pb-24 pt-10 text-center">
        <h1 className="text-balance text-[42px] font-extrabold leading-[1.1] tracking-tight text-ink-1 sm:text-[52px]">
          The single screen for running your whole business.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-ink-2">
          CRM, projects, finance, and scheduling, sitting on top of the tools you already use - not replacing
          them - with AI woven into every module.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-[10px] bg-accent px-6 text-[14.5px] font-semibold text-on-accent hover:opacity-90"
          >
            Get started
          </Link>
          {/* Plain <a>, not Link - /demo issues a new session cookie and
              redirects to /dashboard. A client-side transition can serve
              a cached /dashboard from before the cookie changed; a real
              navigation never does. */}
          <a
            href="/demo"
            className="inline-flex h-11 items-center rounded-[10px] border border-line-strong px-6 text-[14.5px] font-semibold text-ink-1 hover:bg-surface"
          >
            Try the live demo
          </a>
        </div>

        <div className="mt-20 grid gap-5 text-left sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="spotlight-card group rounded-[14px] border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-wash text-accent transition-colors group-hover:bg-accent-wash-strong">
                <p.icon size={18} strokeWidth={1.9} />
              </div>
              <p className="text-[14.5px] font-semibold text-ink-1">{p.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{p.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <h2 className="text-[24px] font-bold text-ink-1">Three editions, one platform</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] text-ink-2">
            Same product foundation, priced and scoped for who's using it - try any of them, no signup required.
          </p>
          <div className="mt-8 grid gap-5 text-left sm:grid-cols-3">
            {EDITIONS.map((edition) => (
              <div
                key={edition.id}
                className="spotlight-card group relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)]"
              >
                <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: edition.accent }} />
                <span
                  className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ color: edition.accent, borderColor: `${edition.accent}4d`, backgroundColor: `${edition.accent}24` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Live product
                </span>
                <p className="mt-2.5 text-[14.5px] font-semibold text-ink-1">{edition.name}</p>
                <p className="mt-1 text-[13px] text-ink-3">
                  <span className="text-[18px] font-bold text-ink-1">${edition.fromPrice}</span>/mo to start
                </p>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-2">{edition.tagline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <a href={edition.demoHref} className="text-[13px] font-semibold hover:underline" style={{ color: edition.accent }}>
                    Try the demo &rarr;
                  </a>
                  {edition.learnMoreHref ? (
                    <Link href={edition.learnMoreHref} className="text-[13px] font-semibold text-ink-2 hover:text-ink-1">
                      Learn more
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-[16px] border border-line bg-surface p-8">
          <h2 className="text-[22px] font-bold text-ink-1">Plans that fit your business</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-[14px] text-ink-2">
            Every tier is built around cost-to-serve, not a made-up number - see exactly what's included at
            each level.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-accent px-5 text-[13.5px] font-semibold text-on-accent hover:opacity-90"
          >
            See full pricing &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}

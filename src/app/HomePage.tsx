import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BarChart3, Building2, Sparkles } from "lucide-react";

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

const EDITIONS = [
  {
    id: "business",
    name: "3Stone One",
    tagline: "The full operating system - CRM, projects, finance, inventory, automation, and analytics.",
    demoHref: "/demo?edition=business",
    learnMoreHref: null,
  },
  {
    id: "workspace",
    name: "3Stone One Workspace",
    tagline: "For day-to-day workers, CEOs, and managers - documents, projects, and meetings, without the back office.",
    demoHref: "/demo?edition=workspace",
    learnMoreHref: "/workspace",
  },
  {
    id: "student",
    name: "3Stone One Student",
    tagline: "Documents, projects, and meetings for coursework and group work - AI available as a paid add-on.",
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
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-14%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent opacity-[0.09] blur-[130px]"
      />

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2.5">
          <Image src="/branding/monogram.svg" alt="" width={28} height={21} priority />
          <span className="text-[15px] font-bold text-ink-1">3Stone One</span>
        </div>
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
          <Link
            href="/demo"
            className="inline-flex h-11 items-center rounded-[10px] border border-line-strong px-6 text-[14.5px] font-semibold text-ink-1 hover:bg-surface"
          >
            Try the live demo
          </Link>
        </div>

        <div className="mt-20 grid gap-5 text-left sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-[14px] border border-line bg-surface p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-wash text-accent">
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
              <div key={edition.id} className="flex flex-col rounded-[14px] border border-line bg-surface p-5">
                <p className="text-[14.5px] font-semibold text-ink-1">{edition.name}</p>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-2">{edition.tagline}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Link href={edition.demoHref} className="text-[13px] font-semibold text-accent hover:underline">
                    Try the demo &rarr;
                  </Link>
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

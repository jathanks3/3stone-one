import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, ChartNoAxesCombined, Sparkles } from "lucide-react";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "3Stone AI — Practical AI for better business",
  description:
    "3Stone AI builds practical intelligence into the decisions, workflows, and products businesses use every day.",
};

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

const PRINCIPLES = [
  {
    icon: BrainCircuit,
    title: "Intelligence with a job to do",
    description: "AI shaped around real decisions and real work, not novelty.",
  },
  {
    icon: Building2,
    title: "Built around your business",
    description: "Products that adapt to how your company and industry actually operate.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Measured by outcomes",
    description: "Less busywork, clearer decisions, and more time for what moves the business.",
  },
];

export default async function RootPage() {
  const session = await getSession();

  if (session) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }

  return (
    <div style={DARK_BRAND_STYLE} className="min-h-screen overflow-hidden bg-bg text-ink-1">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-280px] h-[680px] w-[1100px] -translate-x-1/2 rounded-full bg-accent opacity-[0.11] blur-[150px]"
      />

      <header className="relative mx-auto flex h-20 w-full max-w-[1180px] items-center justify-between px-6 lg:px-10">
        <Link href="/" aria-label="3Stone AI home" className="flex items-center gap-3">
          <Image src="/branding/monogram.svg" alt="" width={30} height={30} priority />
          <span className="text-[15px] font-bold tracking-tight">3Stone AI</span>
        </Link>
        <Link
          href="/login"
          className="rounded-[10px] border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-accent hover:text-ink-1"
        >
          Workspace sign in
        </Link>
      </header>

      <main className="relative">
        <section className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1180px] flex-col justify-center px-6 pb-24 pt-16 lg:px-10 lg:pb-32">
          <div className="flex w-fit items-center gap-2 rounded-full border border-accent-wash-strong bg-accent-wash px-3 py-1.5 text-[12px] font-semibold text-accent">
            <Sparkles size={13} strokeWidth={2.2} />
            AI built for useful work
          </div>
          <h1 className="mt-8 max-w-[850px] text-[48px] font-extrabold leading-[0.98] tracking-[-0.045em] text-balance sm:text-[64px] lg:text-[82px]">
            Better business,
            <span className="block text-accent">powered by intelligence.</span>
          </h1>
          <p className="mt-7 max-w-[650px] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
            3Stone AI builds practical products that help people make clearer decisions,
            move faster, and get more from the work they already do.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#products"
              className="inline-flex h-12 items-center gap-2 rounded-[11px] bg-accent px-5 text-[14px] font-semibold text-on-accent transition-opacity hover:opacity-90"
            >
              Explore our products
              <ArrowRight size={16} />
            </a>
            <Link
              href="/login"
              className="inline-flex h-12 items-center px-2 text-[14px] font-semibold text-ink-2 transition-colors hover:text-ink-1"
            >
              Already use Workspace?
            </Link>
          </div>
        </section>

        <section className="border-y border-line bg-surface/60">
          <div className="mx-auto grid w-full max-w-[1180px] gap-px px-6 py-6 sm:grid-cols-3 lg:px-10">
            {PRINCIPLES.map((principle) => (
              <div key={principle.title} className="flex gap-4 py-5 sm:px-6 sm:first:pl-0">
                <principle.icon
                  size={20}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-accent"
                />
                <div>
                  <h2 className="text-[14px] font-semibold">{principle.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="mx-auto w-full max-w-[1180px] px-6 py-24 lg:px-10 lg:py-32">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-accent">
            The product portfolio
          </p>
          <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="max-w-[650px] text-[34px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[44px]">
              Purpose-built products. One standard: make AI useful.
            </h2>
            <p className="max-w-[360px] text-[14px] leading-relaxed text-ink-2">
              Each product solves a different problem. Together, they reflect how we build:
              focused, practical, and grounded in outcomes.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <article className="group rounded-[22px] border border-line bg-surface p-7 transition-colors hover:border-line-strong sm:p-9">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent-wash px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                  Business operations
                </span>
                <span className="text-[12px] text-ink-3">3Stone AI product</span>
              </div>
              <h3 className="mt-10 text-[28px] font-extrabold tracking-tight">3Stone Workspace</h3>
              <p className="mt-3 max-w-[470px] text-[15px] leading-relaxed text-ink-2">
                One intelligent place to see what needs attention and run your CRM,
                projects, finances, team, and day-to-day operations.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-accent transition-colors hover:text-accent-strong"
              >
                Open Workspace
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </article>

            <article className="group rounded-[22px] border border-line bg-surface p-7 transition-colors hover:border-line-strong sm:p-9">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent-wash px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                  Sports intelligence
                </span>
                <span className="text-[12px] text-ink-3">3Stone AI product</span>
              </div>
              <h3 className="mt-10 text-[28px] font-extrabold tracking-tight">BetAI</h3>
              <p className="mt-3 max-w-[470px] text-[15px] leading-relaxed text-ink-2">
                AI-powered sports analysis that turns complex information into a clearer,
                more confident view of every wager.
              </p>
              <a
                href="https://bet-ai-five.vercel.app"
                className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-accent transition-colors hover:text-accent-strong"
              >
                Explore BetAI
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </a>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-6 py-8 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>© {new Date().getFullYear()} 3Stone AI</span>
          <span>Practical intelligence. Real outcomes.</span>
        </div>
      </footer>
    </div>
  );
}

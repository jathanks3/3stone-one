import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PLAN_TIERS, WORKSPACE_PLAN_TIERS, STUDENT_PLAN_TIERS, ENTERPRISE_LABEL, type PlanTier } from "@/config/pricing";

export const metadata: Metadata = { title: "Pricing — 3Stone One" };

// Same dark-brand treatment as the homepage and signup wizard - one
// visual language across every public-facing surface. Renders tier data
// straight from src/config/pricing.ts - never hand-picks or duplicates
// numbers here, that file is the single source for this repo.
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

const EDITIONS: { id: string; name: string; tagline: string; tiers: PlanTier[]; showEnterprise: boolean }[] = [
  {
    id: "business",
    name: "3Stone One",
    tagline: "The full operating system - CRM, projects, finance, inventory, automation, and analytics.",
    tiers: PLAN_TIERS,
    showEnterprise: true,
  },
  {
    id: "workspace",
    name: "3Stone One Workspace",
    tagline: "For day-to-day workers, CEOs, and managers - documents, projects, and meetings, without the back office.",
    tiers: WORKSPACE_PLAN_TIERS,
    showEnterprise: false,
  },
  {
    id: "student",
    name: "3Stone One Student",
    tagline: "Documents, projects, and meetings for coursework and group work. AI is available as a paid add-on.",
    tiers: STUDENT_PLAN_TIERS,
    showEnterprise: false,
  },
];

function TierGrid({ tiers }: { tiers: PlanTier[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {tiers.map((tier, idx) => (
        <div
          key={tier.key}
          className={`flex flex-col rounded-[16px] border p-6 ${
            idx === 1 ? "border-accent bg-accent-wash" : "border-line bg-surface"
          }`}
        >
          <h3 className="text-[18px] font-bold text-ink-1">{tier.label}</h3>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-[32px] font-extrabold text-ink-1">${tier.priceMonthly}</span>
            <span className="text-[13px] text-ink-3">/month</span>
          </p>
          <p className="mt-1 text-[12.5px] text-ink-3">Up to {tier.maxEmployees} seats</p>
          <p className="mt-4 flex-1 text-[13.5px] leading-relaxed text-ink-2">{tier.blurb}</p>
          <Link
            href="/signup"
            className={`mt-6 inline-flex h-10 items-center justify-center rounded-[10px] text-[13.5px] font-semibold ${
              idx === 1
                ? "bg-accent text-on-accent hover:opacity-90"
                : "border border-line-strong text-ink-1 hover:bg-surface-raised"
            }`}
          >
            Get started
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
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

      <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-6">
        <div className="text-center">
          <h1 className="text-[38px] font-extrabold tracking-tight text-ink-1">Three products, one platform</h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-relaxed text-ink-2">
            Every tier is priced from real cost-to-serve, not a made-up number. Pick the product that fits who&rsquo;s
            using it, then the tier that fits your team size.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-16">
          {EDITIONS.map((edition) => (
            <section key={edition.id}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-ink-1">{edition.name}</h2>
                  <p className="mt-1 max-w-[560px] text-[13.5px] text-ink-2">{edition.tagline}</p>
                </div>
                <Link
                  href={`/demo?edition=${edition.id}`}
                  className="inline-flex h-9 flex-shrink-0 items-center rounded-[10px] border border-line-strong px-4 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
                >
                  Try the demo &rarr;
                </Link>
              </div>
              <TierGrid tiers={edition.tiers} />
              {edition.showEnterprise ? (
                <div className="mt-5 flex flex-col rounded-[16px] border border-line bg-surface p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-[18px] font-bold text-ink-1">{ENTERPRISE_LABEL}</h3>
                      <p className="mt-1 text-[13.5px] text-ink-2">
                        Multiple businesses, multiple locations, dedicated support - built and priced for your scale.
                      </p>
                    </div>
                    <a
                      href="https://calendly.com/jathan-spaulding3/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center rounded-[10px] border border-line-strong px-5 text-[13.5px] font-semibold text-ink-1 hover:bg-surface-raised"
                    >
                      Book a discovery call
                    </a>
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

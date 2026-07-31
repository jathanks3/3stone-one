import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PLAN_TIERS, ENTERPRISE_LABEL } from "@/config/pricing";

export const metadata: Metadata = { title: "Pricing — 3Stone One" };

// Same dark-brand treatment as the homepage and signup wizard - one
// visual language across every public-facing surface. Renders PLAN_TIERS
// directly (see src/config/pricing.ts) - never hand-picks or duplicates
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
          <h1 className="text-[38px] font-extrabold tracking-tight text-ink-1">Plans that fit your business</h1>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-relaxed text-ink-2">
            Every tier is priced from real cost-to-serve, not a made-up number. Pick the tier that matches your
            team size - upgrade or downgrade any time.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {PLAN_TIERS.map((tier, idx) => (
            <div
              key={tier.key}
              className={`flex flex-col rounded-[16px] border p-6 ${
                idx === 1 ? "border-accent bg-accent-wash" : "border-line bg-surface"
              }`}
            >
              <h2 className="text-[18px] font-bold text-ink-1">{tier.label}</h2>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-[32px] font-extrabold text-ink-1">${tier.priceMonthly}</span>
                <span className="text-[13px] text-ink-3">/month</span>
              </p>
              <p className="mt-1 text-[12.5px] text-ink-3">Up to {tier.maxEmployees} employees</p>
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

          <div className="flex flex-col rounded-[16px] border border-line bg-surface p-6 sm:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-ink-1">{ENTERPRISE_LABEL}</h2>
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
        </div>
      </main>
    </div>
  );
}

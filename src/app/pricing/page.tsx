import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PLAN_TIERS, WORKSPACE_PLAN_TIERS, STUDENT_PLAN_TIERS, ENTERPRISE_LABEL, type PlanTier } from "@/config/pricing";
import { TierGrid } from "@/components/marketing/TierGrid";
import { SpotlightCards } from "@/components/marketing/SpotlightCards";

export const metadata: Metadata = {
  title: "Pricing — 3Stone One",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Pricing — 3Stone One", url: "/pricing", type: "website" },
};

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

const EDITIONS: {
  id: string;
  name: string;
  tagline: string;
  tiers: PlanTier[];
  showEnterprise: boolean;
  learnMoreHref?: string;
  accent: string;
}[] = [
  {
    id: "business",
    name: "3Stone One",
    tagline: "The full operating system - CRM, projects, finance, inventory, automation, and analytics.",
    tiers: PLAN_TIERS,
    showEnterprise: true,
    accent: "#6e93d6",
  },
  {
    id: "workspace",
    name: "3Stone One Workspace",
    tagline: "For day-to-day workers, CEOs, and managers - documents, projects, meetings, and time off requests, without the back office.",
    tiers: WORKSPACE_PLAN_TIERS,
    showEnterprise: false,
    learnMoreHref: "/workspace",
    accent: "#5cbf99",
  },
  {
    id: "student",
    name: "3Stone One Student",
    tagline: "Documents, projects, a calendar, notes, a GPA calculator, and a job tracker for coursework. AI is available as a paid add-on.",
    tiers: STUDENT_PLAN_TIERS,
    showEnterprise: false,
    learnMoreHref: "/student",
    accent: "#a594f5",
  },
];

export default function PricingPage() {
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
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: edition.accent }} />
                    <h2 className="text-[24px] font-bold text-ink-1">{edition.name}</h2>
                  </div>
                  <p className="mt-1 max-w-[560px] text-[13.5px] text-ink-2">{edition.tagline}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {edition.learnMoreHref ? (
                    <Link href={edition.learnMoreHref} className="text-[13px] font-semibold text-ink-2 hover:text-ink-1">
                      Learn more
                    </Link>
                  ) : null}
                  {/* Plain <a>, not Link - see HomePage.tsx for why a
                      client-side transition here can serve a cached
                      /dashboard from before the session cookie changed. */}
                  <a
                    href={`/demo?edition=${edition.id}`}
                    className="inline-flex h-9 items-center rounded-[10px] border border-line-strong px-4 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
                  >
                    Try the demo &rarr;
                  </a>
                </div>
              </div>
              <TierGrid tiers={edition.tiers} signupHref="/signup" />
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

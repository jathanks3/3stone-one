import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "3Stone AI — Internal" };

// Deliberately minimal — the real internal dashboard (revenue, MRR,
// trials, who needs help, system health) is a later milestone per
// docs/15-company-platform-vision.md. This exists now so the section has
// a landing page rather than forcing every staff visit to start at
// /3stone-ai/customers, and so the layout's nav has somewhere to point.
//
// 2026-07-25 founder decision: this app (3stone-one) is no longer a
// second customer-facing product competing with workspace.3stoneai.com —
// workspace.3stoneai.com is canonical. This /3stone-ai section is now the
// company-wide Founder Platform. The Customers page below still only
// reads 3stone-one's own (now-frozen, empty) Workspace table — it does
// NOT yet see real Workspace-product customers, since that requires
// workspace.3stoneai.com to expose an API for this app to call. That
// cross-product integration is a real, not-yet-started milestone, not
// something to fake here.
export default function ThreeStoneAiDashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[22px] font-bold text-ink-1">3Stone AI Founder Platform</h1>
      <p className="mt-2 text-[14px] text-ink-2">
        The company-wide control center for 3Stone AI — not a second product. Feature Flags,
        Announcements, Staff, Audit Log, System Health, Sales Pipeline, and Integrations are real
        and live here — Feature Flags and Announcements already reach BetAI in production. Revenue,
        Billing, Subscriptions, Support, AI Usage, Storage Usage, Roles/Permissions granularity, and
        Legal are still ahead.
      </p>
      <p className="mt-2 text-[13px] text-ink-3">
        Customers below reflects this app&apos;s own (now-frozen) data only — it does not yet see
        real workspace.3stoneai.com customers. That requires a real API integration with that
        product, not built yet.
      </p>
      <Link
        href="/3stone-ai/customers"
        className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[13.5px] font-semibold text-on-accent hover:opacity-90"
      >
        View Customers →
      </Link>
    </div>
  );
}

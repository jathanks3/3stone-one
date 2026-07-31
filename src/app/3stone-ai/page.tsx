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
// second customer-facing product competing with admin.3stoneai.com —
// admin.3stoneai.com is canonical. This /3stone-ai section is now the
// company-wide Founder Platform. "Customers" (3stone-one's own frozen,
// empty Workspace table) is now superseded by "Workspace Customers",
// which reads real data directly from admin.3stoneai.com's own
// database (read-only, see workspaceCustomerService.ts) — the cross-
// product integration this comment used to describe as not-yet-started.
export default function ThreeStoneAiDashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[22px] font-bold text-ink-1">3Stone AI Founder Platform</h1>
      <p className="mt-2 text-[14px] text-ink-2">
        The company-wide control center for 3Stone AI — not a second product. Feature Flags,
        Announcements, Staff, Audit Log, System Health, Sales Pipeline, Integrations, and now real
        Workspace Customers are live here — Feature Flags and Announcements already reach BetAI in
        production. Revenue, Billing, Subscriptions, Support, AI Usage, Roles/Permissions
        granularity, and Legal are still ahead.
      </p>
      <Link
        href="/3stone-ai/workspace-customers"
        className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[13.5px] font-semibold text-on-accent hover:opacity-90"
      >
        View Workspace Customers →
      </Link>
    </div>
  );
}

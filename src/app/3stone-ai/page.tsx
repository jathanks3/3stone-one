import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "3Stone AI — Internal" };

// Deliberately minimal — the real internal dashboard (revenue, MRR,
// trials, who needs help, system health) is a later milestone per
// docs/15-company-platform-vision.md. This exists now so the section has
// a landing page rather than forcing every staff visit to start at
// /3stone-ai/customers, and so the layout's nav has somewhere to point.
export default function ThreeStoneAiDashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[22px] font-bold text-ink-1">3Stone AI</h1>
      <p className="mt-2 text-[14px] text-ink-2">
        The founder/staff control center. Only Customers is built so far —
        Revenue, Billing, Subscriptions, Support, System Health, AI Usage,
        Storage Usage, Feature Flags, Announcements, Audit Logs, Staff,
        Roles, Invitations, and Legal are still ahead.
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

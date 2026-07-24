import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, hasStaffAccess } from "@/lib/session";

// Layer 2 of 4 (see docs/15-company-platform-vision.md). proxy.ts already
// gates every /3stone-ai/* request before it reaches here — this re-check
// is deliberate, not redundant-by-accident: this section is low-traffic
// (a handful of staff, not every customer) and every byte of it is
// sensitive, so paying the cost of a fresh per-request session read here
// is the right tradeoff. That's the opposite conclusion from the
// customer workspace's own layout, which deliberately does NOT re-check
// session (see (app)/layout.tsx's comment) because that section is
// high-traffic and its content isn't per-viewer-sensitive. Same
// principle, different traffic/sensitivity profile, different answer.
export default async function ThreeStoneAiLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!hasStaffAccess(session)) {
    redirect(session ? "/dashboard" : "/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line bg-surface px-6">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-ink-1">3Stone AI</span>
          <span className="rounded-full bg-accent-wash px-2 py-0.5 text-[11px] font-semibold text-accent">
            Internal
          </span>
        </div>
        <nav className="flex items-center gap-4 text-[13px] font-medium text-ink-2">
          <Link href="/3stone-ai" className="hover:text-ink-1">
            Dashboard
          </Link>
          <Link href="/3stone-ai/customers" className="hover:text-ink-1">
            Customers
          </Link>
          <Link href="/3stone-ai/prospects" className="hover:text-ink-1">
            Sales Pipeline
          </Link>
          <Link href="/dashboard" className="text-ink-3 hover:text-ink-1">
            ← Back to workspace
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

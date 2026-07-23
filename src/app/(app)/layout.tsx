import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";
import { DEFAULT_BUSINESS_ID } from "@/server/mock-data/businesses";
import { IndustryProvider } from "@/lib/industry";
import { AppShell } from "@/components/shell/AppShell";

// The session check lives in proxy.ts (middleware) — every path this layout
// covers is already gated there before it ever renders. Re-checking cookies()
// here too would force Next.js to treat these routes as fully dynamic
// (uncacheable) for no benefit, since it can't reject anything the
// middleware hasn't already turned away.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Phase 1: a single mock workspace/user. Session lookup will resolve real
  // records once a database exists — see docs/11-roadmap.md Phase 12.
  const workspace = DEMO_WORKSPACE;
  const user = DEMO_USER;

  return (
    <IndustryProvider initialKey={workspace.industryProfileKey} initialBusinessId={DEFAULT_BUSINESS_ID}>
      <AppShell user={user}>{children}</AppShell>
    </IndustryProvider>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";
import { IndustryProvider } from "@/lib/industry";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Phase 1: a single mock workspace/user. Session lookup will resolve real
  // records once a database exists — see docs/11-roadmap.md Phase 12.
  const workspace = DEMO_WORKSPACE;
  const user = DEMO_USER;

  return (
    <IndustryProvider initialKey={workspace.industryProfileKey}>
      <AppShell workspace={workspace} user={user}>
        {children}
      </AppShell>
    </IndustryProvider>
  );
}

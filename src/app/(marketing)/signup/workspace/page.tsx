import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupShell } from "../SignupShell";
import { WorkspaceForm } from "./WorkspaceForm";

export const metadata: Metadata = { title: "Create your workspace — 3Stone One" };

export default async function SignupWorkspacePage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="Create your workspace" stepIndex={3}>
      <WorkspaceForm />
    </SignupShell>
  );
}

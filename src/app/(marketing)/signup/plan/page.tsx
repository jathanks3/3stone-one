import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceEditionForUser } from "@/server/services/onboardingService";
import { SignupShell } from "../SignupShell";
import { PlanForm } from "./PlanForm";

export const metadata: Metadata = { title: "Select your plan — 3Stone One" };

export default async function SignupPlanPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }
  const editionKey = (await getActiveWorkspaceEditionForUser(session.userId)) ?? "business";

  return (
    <SignupShell title="Select your plan" stepIndex={7}>
      <PlanForm editionKey={editionKey} />
    </SignupShell>
  );
}

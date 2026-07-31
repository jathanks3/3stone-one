import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { industryProfileList } from "@/config/industry-profiles";
import { getActiveWorkspaceEditionForUser } from "@/server/services/onboardingService";
import { SignupShell } from "../SignupShell";
import { IndustryForm } from "./IndustryForm";

export const metadata: Metadata = { title: "Choose your industry — 3Stone One" };

export default async function SignupIndustryPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  // Only the flagship (business) edition asks this - Workspace/Student
  // are auto-assigned their own fixed profile in product/actions.ts and
  // skip straight past this step. Reaching this page with a non-business
  // edition means the wizard was re-entered out of order (e.g. back
  // button) - send them to where they actually belong instead of letting
  // them pick a real-world industry that a Workspace/Student workspace
  // will never use.
  const editionKey = (await getActiveWorkspaceEditionForUser(session.userId)) ?? "business";
  if (editionKey !== "business") {
    redirect("/signup/plan");
  }

  return (
    <SignupShell title="What kind of business is this?" subtitle="This sets your terminology — you can change it later." stepIndex={6}>
      <IndustryForm profiles={industryProfileList} />
    </SignupShell>
  );
}

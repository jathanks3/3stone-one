import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceEditionForUser } from "@/server/services/onboardingService";
import { SignupShell } from "../SignupShell";
import { BusinessInfoForm } from "./BusinessInfoForm";

export const metadata: Metadata = { title: "Business information — 3Stone One" };

export default async function SignupBusinessInfoPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  // Only the flagship (business) edition has a "business name" at all -
  // Workspace/Student are routed straight past this step in
  // product/actions.ts. Reaching this page with a non-business edition
  // means the wizard was re-entered out of order (e.g. back button);
  // send them to where they actually belong instead of asking a student
  // for their "business name."
  const editionKey = (await getActiveWorkspaceEditionForUser(session.userId)) ?? "business";
  if (editionKey !== "business") {
    redirect("/signup/plan");
  }

  return (
    <SignupShell title="Tell us about your business" stepIndex={5}>
      <BusinessInfoForm />
    </SignupShell>
  );
}

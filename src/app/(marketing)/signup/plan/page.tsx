import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupShell } from "../SignupShell";
import { PlanForm } from "./PlanForm";

export const metadata: Metadata = { title: "Select your plan — 3Stone One" };

export default async function SignupPlanPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="Select your plan" stepIndex={6}>
      <PlanForm />
    </SignupShell>
  );
}

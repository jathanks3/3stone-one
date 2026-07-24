import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupShell } from "../SignupShell";
import { BusinessInfoForm } from "./BusinessInfoForm";

export const metadata: Metadata = { title: "Business information — 3Stone One" };

export default async function SignupBusinessInfoPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="Tell us about your business" stepIndex={4}>
      <BusinessInfoForm />
    </SignupShell>
  );
}

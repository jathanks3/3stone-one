import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { industryProfileList } from "@/config/industry-profiles";
import { SignupShell } from "../SignupShell";
import { IndustryForm } from "./IndustryForm";

export const metadata: Metadata = { title: "Choose your industry — 3Stone One" };

export default async function SignupIndustryPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="What kind of business is this?" subtitle="This sets your terminology — you can change it later." stepIndex={5}>
      <IndustryForm profiles={industryProfileList} />
    </SignupShell>
  );
}

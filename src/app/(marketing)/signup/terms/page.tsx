import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupShell } from "../SignupShell";
import { TermsForm } from "./TermsForm";

export const metadata: Metadata = { title: "Accept terms — 3Stone One" };

export default async function SignupTermsPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="Almost there" stepIndex={7}>
      <TermsForm />
    </SignupShell>
  );
}

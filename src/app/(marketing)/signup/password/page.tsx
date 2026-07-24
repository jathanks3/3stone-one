import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupShell } from "../SignupShell";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Create a password — 3Stone One" };

export default async function SignupPasswordPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="Create a password" stepIndex={2}>
      <PasswordForm />
    </SignupShell>
  );
}

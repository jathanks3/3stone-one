import type { Metadata } from "next";
import { SignupShell } from "./SignupShell";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Sign up — 3Stone One" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ verifyError?: string }>;
}) {
  const { verifyError } = await searchParams;
  const errorMessage =
    verifyError === "invalid"
      ? "That verification link is invalid or has expired. Enter your email to get a new one."
      : verifyError === "missing"
        ? "That verification link is missing its token."
        : undefined;

  return (
    <SignupShell title="Create your account" subtitle="Start running your business from one screen." stepIndex={0}>
      {errorMessage ? (
        <p role="alert" className="mb-4 text-center text-[13px] text-critical">
          {errorMessage}
        </p>
      ) : null}
      <SignupForm />
    </SignupShell>
  );
}

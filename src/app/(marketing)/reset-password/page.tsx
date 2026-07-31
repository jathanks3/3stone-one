import type { Metadata } from "next";
import { ResetPasswordShell } from "./ResetPasswordShell";
import { RequestResetForm } from "./RequestResetForm";

export const metadata: Metadata = { title: "Reset your password — 3Stone One" };

export default function ResetPasswordPage() {
  return (
    <ResetPasswordShell title="Reset your password" subtitle="Enter the email on your account.">
      <RequestResetForm />
    </ResetPasswordShell>
  );
}

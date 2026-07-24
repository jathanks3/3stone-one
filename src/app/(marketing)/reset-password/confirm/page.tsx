import type { Metadata } from "next";
import { validateResetToken } from "@/server/services/authService";
import { ResetPasswordShell } from "../ResetPasswordShell";
import { ConfirmResetForm } from "./ConfirmResetForm";

export const metadata: Metadata = { title: "Set a new password — 3Stone One" };

export default async function ConfirmResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetPasswordShell title="Set a new password">
        <p role="alert" className="text-center text-[13px] text-critical">
          This link is missing its token.{" "}
          <a href="/reset-password" className="font-medium text-accent hover:text-accent-strong">
            Request a new one
          </a>
          .
        </p>
      </ResetPasswordShell>
    );
  }

  try {
    await validateResetToken(token);
  } catch {
    return (
      <ResetPasswordShell title="Set a new password">
        <p role="alert" className="text-center text-[13px] text-critical">
          This reset link is invalid or has expired.{" "}
          <a href="/reset-password" className="font-medium text-accent hover:text-accent-strong">
            Request a new one
          </a>
          .
        </p>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell title="Set a new password">
      <ConfirmResetForm token={token} />
    </ResetPasswordShell>
  );
}

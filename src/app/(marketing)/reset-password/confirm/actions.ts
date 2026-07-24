"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSession } from "@/lib/session";
import { completePasswordReset } from "@/server/services/authService";

export interface ConfirmResetFormState {
  error?: string;
}

export async function confirmResetAction(
  _prevState: ConfirmResetFormState,
  formData: FormData
): Promise<ConfirmResetFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const headerList = await headers();
  let result: { userId: string; sessionVersion: number };
  try {
    result = await completePasswordReset(token, password, {
      ipAddress: headerList.get("x-forwarded-for"),
      userAgent: headerList.get("user-agent"),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong. Try requesting a new reset link." };
  }

  // Logs the person straight into their new session — the same
  // "reset completes into a real, authenticated session" pattern as
  // /signup/verify. Every session that existed before this moment
  // (including this one, until now) had its sessionVersion left behind.
  await createSession({ userId: result.userId, isDemo: false, sessionVersion: result.sessionVersion });
  redirect("/dashboard");
}

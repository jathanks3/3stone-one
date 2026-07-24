"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { acceptInvitationWithNewPassword } from "@/server/services/teamService";

export interface AcceptInviteFormState {
  error?: string;
}

export async function acceptInviteAction(
  _prevState: AcceptInviteFormState,
  formData: FormData
): Promise<AcceptInviteFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  let result: { userId: string; sessionVersion: number };
  try {
    result = await acceptInvitationWithNewPassword(token, password);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  await createSession({ userId: result.userId, isDemo: false, sessionVersion: result.sessionVersion });
  redirect("/dashboard");
}

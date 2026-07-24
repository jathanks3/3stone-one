"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { setPassword } from "@/server/services/onboardingService";

export interface PasswordFormState {
  error?: string;
}

export async function setPasswordAction(_prevState: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  try {
    await setPassword(session.userId, password);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  redirect("/signup/workspace");
}

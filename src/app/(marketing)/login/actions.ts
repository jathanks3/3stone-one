"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { DEMO_USER, DEMO_WORKSPACE } from "@/server/mock-data";

export interface LoginFormState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter an email and password to continue." };
  }

  // Demo build: no real backend yet — any credentials sign in as the demo workspace.
  await createSession({ userId: DEMO_USER.id, workspaceId: DEMO_WORKSPACE.id });
  redirect("/dashboard");
}

export async function demoLoginAction() {
  await createSession({ userId: DEMO_USER.id, workspaceId: DEMO_WORKSPACE.id });
  redirect("/dashboard");
}

"use server";

import { startSignup } from "@/server/services/onboardingService";

export interface SignupFormState {
  error?: string;
  submittedEmail?: string;
  // Only present because email delivery is stubbed (see
  // onboardingService.ts) — shown on the confirmation screen so the flow
  // stays completable without real email infrastructure. Never something
  // a production system with real email would expose to the client.
  devVerifyToken?: string;
}

export async function signupAction(_prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  try {
    const { verificationToken } = await startSignup(email);
    return { submittedEmail: email, devVerifyToken: verificationToken };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong. Try again." };
  }
}

"use server";

import { startSignup } from "@/server/services/onboardingService";
import { cookies } from "next/headers";

export interface SignupFormState {
  error?: string;
  submittedEmail?: string;
  // Only present when email delivery is NOT actually configured (see
  // emailService.ts) — shown on the confirmation screen so the flow
  // stays completable without real email infrastructure. Once Google
  // Workspace SMTP is configured, this stays undefined and only the
  // "we sent a link" message shows — the raw link must never be handed
  // to the client once a real email actually went out, or verification
  // proves nothing.
  devVerifyToken?: string;
}

export async function signupAction(_prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  try {
    const { verificationToken, delivered } = await startSignup(email);
    const desiredEdition = String(formData.get("desiredEdition") ?? "");
    const billingMode = String(formData.get("billingMode") ?? "");
    const cookieStore = await cookies();
    if (["business", "workspace", "student"].includes(desiredEdition)) {
      cookieStore.set("signup_edition", desiredEdition, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 30, path: "/signup" });
    }
    if (billingMode === "wholesale-annual") {
      cookieStore.set("signup_billing", billingMode, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 30, path: "/signup" });
    }
    return { submittedEmail: email, devVerifyToken: delivered ? undefined : verificationToken };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong. Try again." };
  }
}

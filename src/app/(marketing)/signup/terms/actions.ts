"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser, acceptTerms, completeSetup } from "@/server/services/onboardingService";
import { db } from "@/server/db";
import { createCheckoutSession, isStripeConfigured } from "@/server/services/stripeService";
import type { WorkspacePlan } from "@/types";
import { getPlanTiersForEdition } from "@/config/pricing";

export interface TermsFormState {
  error?: string;
}

export async function acceptTermsAction(_prevState: TermsFormState, formData: FormData): Promise<TermsFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }
  if (formData.get("accepted") !== "on") {
    return { error: "You need to accept the Terms of Service to continue." };
  }

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await acceptTerms(workspaceId, session.userId, ipAddress);
  await completeSetup(workspaceId);
  const workspace = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { editionKey: true } });
  const cookieStore = await cookies();
  const selectedPlan = (cookieStore.get("signup_plan")?.value ?? "free") as WorkspacePlan;
  const billingMode = cookieStore.get("signup_billing")?.value === "wholesale-annual" ? "wholesale-annual" : "monthly";
  const selectedTier = getPlanTiersForEdition(workspace.editionKey).find((tier) => tier.key === selectedPlan);
  const seatCount = Math.max(1, Math.min(selectedTier?.maxEmployees ?? 1, Number(cookieStore.get("signup_seats")?.value) || 1));
  const allowedPlans = new Set<WorkspacePlan>([
    "free",
    ...getPlanTiersForEdition(workspace.editionKey).map((tier) => tier.key),
  ]);
  if (!allowedPlans.has(selectedPlan)) return { error: "Choose a valid plan before continuing." };

  if (selectedPlan !== "free" && selectedPlan !== "enterprise") {
    if (!isStripeConfigured()) return { error: "Paid checkout is temporarily unavailable. Choose Free or try again shortly." };
    const headerListForOrigin = await headers();
    const host = headerListForOrigin.get("host");
    const protocol = host?.startsWith("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const { url } = await createCheckoutSession(
      workspaceId,
      selectedPlan as Exclude<WorkspacePlan, "free" | "enterprise">,
      { successUrl: `${origin}/dashboard?billing=success`, cancelUrl: `${origin}/signup/plan?checkout=cancelled` },
      { trialDays: billingMode === "monthly" ? 14 : undefined, billingMode, seatCount }
    );
    cookieStore.delete("signup_plan");
    cookieStore.delete("signup_billing");
    cookieStore.delete("signup_edition");
    cookieStore.delete("signup_seats");
    redirect(url);
  }
  cookieStore.delete("signup_plan");
  cookieStore.delete("signup_billing");
  cookieStore.delete("signup_edition");
  cookieStore.delete("signup_seats");
  redirect("/dashboard");
}

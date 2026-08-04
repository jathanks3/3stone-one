"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceEditionForUser, getActiveWorkspaceIdForUser, selectPlan } from "@/server/services/onboardingService";
import { getPlanTiersForEdition } from "@/config/pricing";
import type { WorkspacePlan } from "@/types";

export interface PlanFormState {
  error?: string;
}

export async function selectPlanAction(_prevState: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const session = await getSession();
  if (!session || session.isDemo) {
    return { error: "Your session has expired — start over from /signup." };
  }
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return { error: "Create a workspace first." };
  }

  const editionKey = (await getActiveWorkspaceEditionForUser(session.userId)) ?? "business";
  const requested = String(formData.get("plan") ?? "free") as WorkspacePlan;
  const allowed = new Set<WorkspacePlan>(["free", ...getPlanTiersForEdition(editionKey).map((tier) => tier.key)]);
  if (!allowed.has(requested)) return { error: "Choose a valid plan for this edition." };
  const selectedTier = getPlanTiersForEdition(editionKey).find((tier) => tier.key === requested);
  const seatCount = Math.max(1, Math.min(selectedTier?.maxEmployees ?? 1, Number(formData.get("seatCount")) || 1));
  // Keep the persisted entitlement on Free until Stripe confirms checkout.
  // The short-lived, httpOnly cookie only carries the customer's selection
  // between the two signup screens; the terms action validates it again.
  await selectPlan(workspaceId, "free");
  const cookieStore = await cookies();
  cookieStore.set("signup_plan", requested, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
    path: "/signup",
  });
  cookieStore.set("signup_seats", String(seatCount), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
    path: "/signup",
  });
  redirect("/signup/terms");
}

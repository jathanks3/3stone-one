"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import {
  createDeal,
  createOrganization,
  createPerson,
  deleteDeal,
  deleteOrganization,
  deletePerson,
  moveDealStage,
  type CreatePersonInput,
  type PipelineStageKey,
} from "@/server/services/crmService";
import type { PersonType } from "../../../../generated/prisma/client";

export interface ActionState {
  error?: string;
  success?: string;
  id?: string;
}

async function currentWorkspaceId(): Promise<{ userId: string; workspaceId: string }> {
  const session = await getSession();
  if (!session || session.isDemo) throw new Error("Not authenticated.");
  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) throw new Error("No workspace.");
  return { userId: session.userId, workspaceId };
}

export async function createOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const org = await createOrganization(
      workspaceId,
      userId,
      String(formData.get("name") ?? ""),
      String(formData.get("domain") ?? ""),
      String(formData.get("industry") ?? "")
    );
    revalidatePath("/crm");
    return { success: "Company added.", id: org.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteOrganization(workspaceId, String(formData.get("orgId") ?? ""), userId);
    revalidatePath("/crm");
    return { success: "Company deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createPersonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const input: CreatePersonInput = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? "") || undefined,
      phone: String(formData.get("phone") ?? "") || undefined,
      organizationId: String(formData.get("organizationId") ?? "") || undefined,
      personType: (String(formData.get("personType") ?? "lead") as PersonType),
    };
    const person = await createPerson(workspaceId, userId, input);
    revalidatePath("/crm");
    return { success: "Contact added.", id: person.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deletePersonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deletePerson(workspaceId, String(formData.get("personId") ?? ""), userId);
    revalidatePath("/crm");
    return { success: "Contact deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createDealAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    const deal = await createDeal(
      workspaceId,
      userId,
      String(formData.get("title") ?? ""),
      Number(formData.get("value") ?? 0),
      String(formData.get("personId") ?? ""),
      String(formData.get("organizationId") ?? "") || undefined
    );
    revalidatePath("/crm");
    return { success: "Deal added.", id: deal.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function moveDealStageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await moveDealStage(workspaceId, String(formData.get("dealId") ?? ""), userId, String(formData.get("stageKey") ?? "") as PipelineStageKey);
    revalidatePath("/crm");
    return { success: "Deal updated." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteDealAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { userId, workspaceId } = await currentWorkspaceId();
    await requireActiveMember(userId, workspaceId);
    await deleteDeal(workspaceId, String(formData.get("dealId") ?? ""), userId);
    revalidatePath("/crm");
    return { success: "Deal deleted." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

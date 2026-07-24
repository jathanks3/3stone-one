"use server";

import { revalidatePath } from "next/cache";
import { getSession, hasStaffAccess } from "@/lib/session";
import { testIntegration } from "@/server/platform/services/integrationCenterService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

export interface TestConnectionState {
  result?: { ok: boolean; message: string };
}

export async function testConnectionAction(_prev: TestConnectionState, formData: FormData): Promise<TestConnectionState> {
  const session = await getSession();
  if (!hasStaffAccess(session)) return {};
  const key = String(formData.get("key") ?? "");

  const result = await testIntegration(key);
  await recordAuditEntry({ staffUserId: session.userId, action: "tested_integration", metadata: { key, ok: result.ok } });
  revalidatePath("/3stone-ai/integrations");
  return { result };
}

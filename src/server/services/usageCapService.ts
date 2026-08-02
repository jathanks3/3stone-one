import { db } from "@/server/db";
import { AI_ACTIONS_INCLUDED_PER_CYCLE, STORAGE_GB_INCLUDED } from "@/config/usageCaps";

const BYTES_PER_GB = 1_000_000_000;

/** The current billing cycle window for usage counting. Falls back to a
 * rolling 30 days from account creation if Stripe hasn't set a real
 * period yet (e.g. still on the free trial) - so the cap is never
 * accidentally unbounded just because no invoice has happened yet. */
function cycleWindow(subscription: { currentPeriodStart: Date | null; currentPeriodEnd: Date | null; createdAt: Date }): {
  start: Date;
  end: Date;
} {
  if (subscription.currentPeriodStart && subscription.currentPeriodEnd) {
    return { start: subscription.currentPeriodStart, end: subscription.currentPeriodEnd };
  }
  const start = subscription.createdAt;
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { start, end };
}

export interface AiUsageStatus {
  used: number;
  included: number;
  purchased: number;
  total: number;
  remaining: number;
  atCap: boolean;
  cycleEnd: Date;
}

export async function getAiUsageStatus(workspaceId: string): Promise<AiUsageStatus> {
  const subscription = await db.subscription.findUnique({ where: { workspaceId } });
  const createdAt = subscription?.createdAt ?? new Date();
  const { start, end } = cycleWindow({
    currentPeriodStart: subscription?.currentPeriodStart ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    createdAt,
  });

  const used = await db.aiUsageEvent.count({
    where: { workspaceId, createdAt: { gte: start, lt: end } },
  });
  const purchased = subscription?.aiActionsPurchased ?? 0;
  const total = AI_ACTIONS_INCLUDED_PER_CYCLE + purchased;

  return {
    used,
    included: AI_ACTIONS_INCLUDED_PER_CYCLE,
    purchased,
    total,
    remaining: Math.max(0, total - used),
    atCap: used >= total,
    cycleEnd: end,
  };
}

/** Call before making the real (billable) Anthropic request - never after. */
export async function assertAiCapacity(workspaceId: string): Promise<void> {
  const status = await getAiUsageStatus(workspaceId);
  if (status.atCap) {
    throw new UsageCapError(
      `You've used all ${status.total} AI actions included this billing cycle. Buy more in Settings → Billing, or it resets ${status.cycleEnd.toLocaleDateString()}.`
    );
  }
}

/** Call only after the real AI call actually succeeded - a failed call
 * must never count against the cap. */
export async function recordAiUsage(workspaceId: string, userId: string): Promise<void> {
  await db.aiUsageEvent.create({ data: { workspaceId, userId } });
}

export interface StorageUsageStatus {
  usedBytes: number;
  includedGb: number;
  purchasedGb: number;
  totalBytes: number;
  remainingBytes: number;
  atCap: boolean;
}

export async function getStorageUsageStatus(workspaceId: string): Promise<StorageUsageStatus> {
  const [subscription, agg] = await Promise.all([
    db.subscription.findUnique({ where: { workspaceId } }),
    db.uploadedFile.aggregate({ where: { workspaceId }, _sum: { sizeBytes: true } }),
  ]);
  const purchasedGb = subscription?.storageGbPurchased ?? 0;
  const totalBytes = (STORAGE_GB_INCLUDED + purchasedGb) * BYTES_PER_GB;
  const usedBytes = agg._sum.sizeBytes ?? 0;

  return {
    usedBytes,
    includedGb: STORAGE_GB_INCLUDED,
    purchasedGb,
    totalBytes,
    remainingBytes: Math.max(0, totalBytes - usedBytes),
    atCap: usedBytes >= totalBytes,
  };
}

/** Call before issuing a signed upload URL, with the file's real size -
 * rejecting after upload would waste the transfer for nothing. */
export async function assertStorageCapacity(workspaceId: string, incomingFileBytes: number): Promise<void> {
  const status = await getStorageUsageStatus(workspaceId);
  if (status.usedBytes + incomingFileBytes > status.totalBytes) {
    const remainingGb = (status.remainingBytes / BYTES_PER_GB).toFixed(2);
    throw new UsageCapError(
      `This file would put you over your ${status.includedGb + status.purchasedGb}GB storage limit (${remainingGb}GB left). Buy more storage in Settings → Billing.`
    );
  }
}

export class UsageCapError extends Error {}

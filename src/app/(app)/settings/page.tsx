import type { Metadata } from "next";
import { SettingsClient } from "@/features/settings/SettingsClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { getWorkspaceSettings } from "@/server/services/workspaceSettingsService";
import { listMembers, listPendingInvitations } from "@/server/services/teamService";
import { getBillingSummary } from "@/server/services/billingService";
import { isStripeConfigured } from "@/server/services/stripeService";
import { isStorageConfigured } from "@/server/services/storageService";
import { RealSettingsClient } from "./RealSettingsClient";

export const metadata: Metadata = { title: "Settings — 3Stone One" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    return <SettingsClient />;
  }

  const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
  if (!workspaceId) {
    return <SettingsClient />;
  }

  const [settings, members, invitations, billing] = await Promise.all([
    getWorkspaceSettings(workspaceId),
    listMembers(workspaceId),
    listPendingInvitations(workspaceId),
    getBillingSummary(workspaceId),
  ]);

  const ownMember = members.find((m) => m.userId === session.userId);

  return (
    <RealSettingsClient
      settings={settings}
      members={members}
      invitations={invitations}
      billing={billing}
      ownMemberId={ownMember?.id ?? ""}
      isOwner={ownMember?.roleName === "Owner"}
      stripeConfigured={isStripeConfigured()}
      storageConfigured={isStorageConfigured()}
    />
  );
}

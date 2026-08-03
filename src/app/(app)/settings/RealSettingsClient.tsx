"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Sun, Moon, Monitor, Type } from "lucide-react";
import { Tabs } from "@/ui/Tabs";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Avatar } from "@/ui/Avatar";
import { FileUploadField } from "@/components/shared/FileUploadField";
import { industryProfileList } from "@/config/industry-profiles";
import { getPlanTiersForEdition, type PlanTier } from "@/config/pricing";
import { useIndustry } from "@/lib/industry";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { useFontSize, type FontSizeMode } from "@/lib/fontSize";
import { useReducedMotion } from "@/lib/reducedMotion";
import { useAccentColor, type AccentColor } from "@/lib/accentColor";
import { useAssistantSize, type AssistantSizeMode } from "@/lib/assistantSize";
import { cn } from "@/lib/utils";
import type { WorkspaceSettings } from "@/server/services/workspaceSettingsService";
import type { TeamMemberRow, PendingInvitationRow, AssignableRoleName } from "@/server/services/teamService";
import type { BillingSummary } from "@/server/services/billingService";
import type { AiUsageStatus, StorageUsageStatus } from "@/server/services/usageCapService";
import {
  AI_OVERAGE_PACK_ACTIONS,
  AI_OVERAGE_PACK_PRICE_CENTS,
  STORAGE_OVERAGE_PACK_GB,
  STORAGE_OVERAGE_PACK_PRICE_CENTS,
} from "@/config/usageCaps";
import {
  type ActionState,
  updateSettingsAction,
  inviteMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  changeRoleAction,
  removeMemberAction,
  transferOwnershipAction,
  startCheckoutAction,
  openBillingPortalAction,
  buyOveragePackAction,
} from "./actions";

const ASSIGNABLE_ROLES: AssignableRoleName[] = ["Admin", "Manager", "Member", "Client"];
const emptyState: ActionState = {};

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-[12.5px] text-critical">{state.error}</p>;
  if (state.success) {
    return (
      <p className="text-[12.5px] text-good">
        {state.success}
        {state.link ? (
          <>
            {" "}
            <a href={state.link} className="font-medium underline">
              Open the invite link
            </a>
            .
          </>
        ) : null}
      </p>
    );
  }
  return null;
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-10 rounded-[9px] border border-line bg-surface px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
      />
    </label>
  );
}

const THEME_OPTIONS: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "system", icon: Monitor, label: "System" },
];

const FONT_SIZE_OPTIONS: { key: FontSizeMode; label: string }[] = [
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
];

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; icon?: typeof Sun }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[10px] border border-line bg-surface-raised p-1">
      {options.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-[7px] py-1.5 text-[12.5px] font-medium transition-colors",
            value === key ? "bg-surface text-accent shadow-[var(--shadow)]" : "text-ink-3 hover:text-ink-1"
          )}
        >
          {Icon ? <Icon size={14} /> : null}
          {label}
        </button>
      ))}
    </div>
  );
}

const ACCENT_COLOR_OPTIONS: { key: AccentColor; label: string; swatch: string }[] = [
  { key: "default", label: "Default", swatch: "" },
  { key: "blue", label: "Blue", swatch: "#3f63a8" },
  { key: "green", label: "Green", swatch: "#2f7d5c" },
  { key: "purple", label: "Purple", swatch: "#6f57d6" },
];

const ASSISTANT_SIZE_OPTIONS: { key: AssistantSizeMode; label: string }[] = [
  { key: "large", label: "Large" },
  { key: "compact", label: "Compact" },
];

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();
  const { fontSize, setFontSize } = useFontSize();
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const { assistantSize, setAssistantSize } = useAssistantSize();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <p className="text-[14px] font-semibold text-ink-1">Theme</p>
        <p className="mt-1 text-[12.5px] text-ink-3">Applies everywhere you use 3Stone One on this device.</p>
        <div className="mt-3">
          <SegmentedControl options={THEME_OPTIONS} value={theme} onChange={setTheme} />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-[14px] font-semibold text-ink-1">Accent color</p>
        <p className="mt-1 text-[12.5px] text-ink-3">Default matches your edition's own color - pick one to override it.</p>
        <div className="mt-3 flex gap-3">
          {ACCENT_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setAccentColor(opt.key)}
              title={opt.label}
              aria-label={opt.label}
              aria-pressed={accentColor === opt.key}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform",
                accentColor === opt.key ? "border-accent scale-110" : "border-transparent hover:scale-105"
              )}
            >
              {opt.key === "default" ? (
                <span className="h-6 w-6 rounded-full border border-line bg-accent" />
              ) : (
                <span className="h-6 w-6 rounded-full" style={{ backgroundColor: opt.swatch }} />
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-[14px] font-semibold text-ink-1">Font size</p>
        <p className="mt-1 text-[12.5px] text-ink-3">Scales the whole app up or down for readability.</p>
        <div className="mt-3">
          <SegmentedControl
            options={FONT_SIZE_OPTIONS.map((o) => ({ ...o, icon: Type }))}
            value={fontSize}
            onChange={setFontSize}
          />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-[14px] font-semibold text-ink-1">AI assistant size</p>
        <p className="mt-1 text-[12.5px] text-ink-3">The floating assistant button in the corner of every page.</p>
        <div className="mt-3">
          <SegmentedControl options={ASSISTANT_SIZE_OPTIONS} value={assistantSize} onChange={setAssistantSize} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-ink-1">Reduce motion</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Turns off animations and transitions throughout the app.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className={cn(
              "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors",
              reducedMotion ? "bg-accent" : "bg-surface-raised border border-line"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                reducedMotion ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}

function CompanyTab({ settings, storageConfigured }: { settings: WorkspaceSettings; storageConfigured: boolean }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, emptyState);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const { editionKey } = useIndustry();
  // Industry (which vertical's terminology to relabel the app with) is a
  // Business-edition-only concept - Workspace and Student each already
  // have their own fixed profile ("workplace"/"student"), never swapped
  // to "Construction" or "Restaurant" the way a real business would.
  const isBusiness = editionKey === "business";
  return (
    <Card className="flex flex-col gap-4 p-5">
      {storageConfigured ? (
        <FileUploadField kind="logo" currentUrl={logoUrl} label="Workspace logo" onUploaded={setLogoUrl} />
      ) : null}
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Workspace name" name="name" defaultValue={settings.name} />
          <Field label="Slug (yourname.3stoneone.com)" name="slug" defaultValue={settings.slug} />
          <Field label="Timezone" name="timezone" defaultValue={settings.timezone ?? ""} />
          <Field label="Contact email" name="contactEmail" defaultValue={settings.contactEmail ?? ""} type="email" />
          <Field label="Contact phone" name="contactPhone" defaultValue={settings.contactPhone ?? ""} />
          {isBusiness ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-ink-2">Industry</span>
              <select
                name="industryProfileKey"
                defaultValue={settings.industryProfileKey ?? ""}
                className="h-10 rounded-[9px] border border-line bg-surface px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              >
                {industryProfileList.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <Field label="Business address" name="address" defaultValue={settings.address ?? ""} />
        {!storageConfigured ? (
          <Field label="Logo URL" name="logoUrl" defaultValue={settings.logoUrl ?? ""} />
        ) : null}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" className="w-fit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <ActionMessage state={state} />
        </div>
      </form>
    </Card>
  );
}

function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, emptyState);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-[10px] border border-line bg-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2">Email</span>
        <input
          name="email"
          type="email"
          required
          className="h-9 w-56 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1 outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2">Role</span>
        <select
          name="roleName"
          defaultValue="Member"
          className="h-9 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1"
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="primary" disabled={pending}>
        <Plus size={14} /> {pending ? "Sending…" : "Invite"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function MemberRow({ member, isSelf }: { member: TeamMemberRow; isSelf: boolean }) {
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, emptyState);
  const [removeState, removeAction, removePending] = useActionState(removeMemberAction, emptyState);
  const isOwner = member.roleName === "Owner";

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar initials={member.name.slice(0, 2).toUpperCase()} size={26} />
          <span className="font-medium text-ink-1">{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-ink-2">{member.email}</td>
      <td className="px-4 py-2.5">
        {isOwner ? (
          <Badge tone="accent">Owner</Badge>
        ) : (
          <form action={roleAction} className="flex items-center gap-1.5">
            <input type="hidden" name="memberId" value={member.id} />
            <select
              name="roleName"
              defaultValue={member.roleName}
              disabled={rolePending}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-8 rounded-[7px] border border-line bg-surface px-2 text-[12.5px] text-ink-1"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {roleState.error ? <span className="text-[11px] text-critical">{roleState.error}</span> : null}
          </form>
        )}
      </td>
      <td className="px-4 py-2.5 text-ink-2">{member.joinedAt.toLocaleDateString()}</td>
      <td className="px-4 py-2.5">
        {!isOwner && !isSelf ? (
          <form action={removeAction}>
            <input type="hidden" name="memberId" value={member.id} />
            <button type="submit" disabled={removePending} className="text-critical hover:opacity-80" aria-label="Remove member">
              <Trash2 size={15} />
            </button>
            {removeState.error ? <p className="text-[11px] text-critical">{removeState.error}</p> : null}
          </form>
        ) : null}
      </td>
    </tr>
  );
}

function InvitationRow({ invitation }: { invitation: PendingInvitationRow }) {
  const [resendState, resendAction, resendPending] = useActionState(resendInvitationAction, emptyState);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeInvitationAction, emptyState);
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-2.5 text-ink-1">{invitation.email}</td>
      <td className="px-4 py-2.5 text-ink-2">{invitation.roleName}</td>
      <td className="px-4 py-2.5 text-ink-2">{invitation.invitedByName}</td>
      <td className="px-4 py-2.5 text-ink-2">{invitation.expiresAt.toLocaleDateString()}</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <form action={resendAction}>
            <input type="hidden" name="invitationId" value={invitation.id} />
            <button type="submit" disabled={resendPending} className="text-[12.5px] font-medium text-accent hover:text-accent-strong">
              Resend
            </button>
          </form>
          <form action={revokeAction}>
            <input type="hidden" name="invitationId" value={invitation.id} />
            <button type="submit" disabled={revokePending} className="text-[12.5px] font-medium text-critical hover:opacity-80">
              Revoke
            </button>
          </form>
        </div>
        {resendState.error || revokeState.error ? (
          <p className="text-[11px] text-critical">{resendState.error ?? revokeState.error}</p>
        ) : null}
      </td>
    </tr>
  );
}

function TransferOwnership({ members, ownMemberId }: { members: TeamMemberRow[]; ownMemberId: string }) {
  const [state, formAction, pending] = useActionState(transferOwnershipAction, emptyState);
  const candidates = members.filter((m) => m.id !== ownMemberId && m.roleName !== "Owner");
  if (candidates.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-[10px] border border-line bg-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2">Transfer ownership to</span>
        <select name="toMemberId" className="h-9 rounded-[8px] border border-line-strong bg-bg px-2.5 text-[13px] text-ink-1">
          {candidates.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Transferring…" : "Transfer ownership"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function TeamTab({
  members,
  invitations,
  ownMemberId,
  isOwner,
}: {
  members: TeamMemberRow[];
  invitations: PendingInvitationRow[];
  ownMemberId: string;
  isOwner: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <InviteForm />

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Active members</p>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-ink-3">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <MemberRow key={m.id} member={m} isSelf={m.id === ownMemberId} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Pending invitations</p>
        {invitations.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[13px] text-ink-3">
            No pending invitations.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line text-ink-3">
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Invited by</th>
                  <th className="px-4 py-2.5 font-medium">Expires</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((i) => (
                  <InvitationRow key={i.id} invitation={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isOwner ? (
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Ownership</p>
          <TransferOwnership members={members} ownMemberId={ownMemberId} />
        </div>
      ) : null}
    </div>
  );
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PlanCard({ plan, stripeConfigured }: { plan: PlanTier; stripeConfigured: boolean }) {
  const [state, formAction, pending] = useActionState(startCheckoutAction, emptyState);
  return (
    <div className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-3">
      <div>
        <p className="text-[13.5px] font-semibold text-ink-1">{plan.label}</p>
        <p className="text-[12px] text-ink-3">${plan.priceMonthly}/mo · up to {plan.maxEmployees} employees</p>
      </div>
      {stripeConfigured ? (
        <form action={formAction}>
          <input type="hidden" name="planKey" value={plan.key} />
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Redirecting…" : "Upgrade"}
          </Button>
        </form>
      ) : (
        <Button variant="secondary" disabled title="Billing isn't live yet">
          Contact us
        </Button>
      )}
      {state.error ? <p className="text-[11px] text-critical">{state.error}</p> : null}
    </div>
  );
}

function UsageMeter({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const nearCap = pct >= 90;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[12.5px] text-ink-3">{label}</p>
        <p className={`text-[12.5px] font-medium ${nearCap ? "text-critical" : "text-ink-2"}`}>
          {used.toLocaleString()} / {total.toLocaleString()} {unit}
        </p>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className={`h-full rounded-full ${nearCap ? "bg-critical" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BuyPackButton({ packKey, label }: { packKey: "ai_overage" | "storage_overage"; label: string }) {
  const [state, formAction, pending] = useActionState(buyOveragePackAction, emptyState);
  return (
    <form action={formAction}>
      <input type="hidden" name="packKey" value={packKey} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Opening…" : label}
      </Button>
      {state.error ? <p className="mt-2 text-[11px] text-critical">{state.error}</p> : null}
    </form>
  );
}

function UsageCard({ aiUsage, storageUsage }: { aiUsage: AiUsageStatus; storageUsage: StorageUsageStatus }) {
  const storageUsedGb = storageUsage.usedBytes / 1_000_000_000;
  const storageTotalGb = storageUsage.includedGb + storageUsage.purchasedGb;
  return (
    <Card className="p-5">
      <p className="text-[14px] font-semibold text-ink-1">AI &amp; storage usage</p>
      <p className="mt-1 text-[12.5px] text-ink-3">
        {aiUsage.isPaid
          ? "Real AI is included on your plan — this cycle's allowance, and what more costs if you need it."
          : "A free trial taste of the real assistant — upgrade to a paid plan for the full monthly allowance."}
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <UsageMeter
          label={aiUsage.isPaid ? "AI actions this cycle" : "AI actions (free trial)"}
          used={aiUsage.used}
          total={aiUsage.total}
          unit="actions"
        />
        <UsageMeter label="Storage" used={Math.round(storageUsedGb * 10) / 10} total={storageTotalGb} unit="GB" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {aiUsage.isPaid ? (
          <BuyPackButton packKey="ai_overage" label={`+${AI_OVERAGE_PACK_ACTIONS} AI actions — $${(AI_OVERAGE_PACK_PRICE_CENTS / 100).toFixed(0)}`} />
        ) : null}
        <BuyPackButton packKey="storage_overage" label={`+${STORAGE_OVERAGE_PACK_GB}GB storage — $${(STORAGE_OVERAGE_PACK_PRICE_CENTS / 100).toFixed(0)}`} />
      </div>
    </Card>
  );
}

function BillingTab({
  billing,
  stripeConfigured,
  aiUsage,
  storageUsage,
}: {
  billing: BillingSummary;
  stripeConfigured: boolean;
  aiUsage: AiUsageStatus;
  storageUsage: StorageUsageStatus;
}) {
  const [portalState, portalAction, portalPending] = useActionState(openBillingPortalAction, emptyState);
  const { editionKey } = useIndustry();
  const planTiers = getPlanTiersForEdition(editionKey);
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold capitalize text-ink-1">
              {billing.plan.replace("_", " ")} plan {billing.isFounderPricing ? <Badge tone="accent">Founder pricing</Badge> : null}
            </p>
            <p className="mt-1 text-[12.5px] text-ink-3 capitalize">Status: {billing.status.replace("_", " ")}</p>
            {billing.trialEndsAt ? (
              <p className="text-[12.5px] text-ink-3">Trial ends {billing.trialEndsAt.toLocaleDateString()}</p>
            ) : null}
          </div>
          <p className="text-[20px] font-bold text-ink-1">
            {formatCents(billing.mrrCents)}
            <span className="text-[13px] font-medium text-ink-3">/mo</span>
          </p>
        </div>
        {stripeConfigured ? (
          <form action={portalAction} className="mt-4">
            <Button type="submit" variant="secondary" className="w-fit" disabled={portalPending}>
              {portalPending ? "Opening…" : "Manage billing"}
            </Button>
            {portalState.error ? <p className="mt-2 text-[11px] text-critical">{portalState.error}</p> : null}
          </form>
        ) : (
          <Button variant="secondary" className="mt-4 w-fit" disabled title="Billing isn't live yet">
            Contact us to upgrade
          </Button>
        )}
      </Card>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Plans</p>
        <div className="flex flex-col gap-2">
          {planTiers.map((plan) => (
            <PlanCard key={plan.key} plan={plan} stripeConfigured={stripeConfigured} />
          ))}
        </div>
      </div>

      <UsageCard aiUsage={aiUsage} storageUsage={storageUsage} />

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Invoice history</p>
        {billing.invoices.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[13px] text-ink-3">
            No invoices yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {billing.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2.5 text-[13px]">
                <span className="text-ink-2">{inv.dueDate?.toLocaleDateString() ?? "—"}</span>
                <span className="text-ink-1">{formatCents(inv.amountCents)}</span>
                <Badge tone={inv.status === "paid" ? "good" : "neutral"}>{inv.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RealSettingsClient({
  settings,
  members,
  invitations,
  billing,
  aiUsage,
  storageUsage,
  ownMemberId,
  isOwner,
  stripeConfigured,
  storageConfigured,
}: {
  settings: WorkspaceSettings;
  members: TeamMemberRow[];
  invitations: PendingInvitationRow[];
  billing: BillingSummary;
  aiUsage: AiUsageStatus;
  storageUsage: StorageUsageStatus;
  ownMemberId: string;
  isOwner: boolean;
  stripeConfigured: boolean;
  storageConfigured: boolean;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Settings</h1>
      <p className="mt-1 text-[14px] text-ink-2">Company profile, team, and billing.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            {
              key: "company",
              label: "Company",
              content: <CompanyTab settings={settings} storageConfigured={storageConfigured} />,
            },
            {
              key: "team",
              label: "Team",
              content: <TeamTab members={members} invitations={invitations} ownMemberId={ownMemberId} isOwner={isOwner} />,
            },
            {
              key: "billing",
              label: "Billing",
              content: <BillingTab billing={billing} stripeConfigured={stripeConfigured} aiUsage={aiUsage} storageUsage={storageUsage} />,
            },
            { key: "appearance", label: "Appearance", content: <AppearanceTab /> },
          ]}
        />
      </div>
    </div>
  );
}

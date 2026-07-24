"use client";

import { useActionState, useState } from "react";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { FileUploadField } from "@/components/shared/FileUploadField";
import type { Profile } from "@/server/services/profileService";
import { type ActionState, updateProfileAction, changePasswordAction, updatePreferencesAction } from "./actions";

const emptyState: ActionState = {};

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-2 text-[12.5px] text-critical">{state.error}</p>;
  if (state.success) return <p className="mt-2 text-[12.5px] text-good">{state.success}</p>;
  return null;
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string; type?: string }) {
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

export function ProfileClient({ profile, storageConfigured }: { profile: Profile; storageConfigured: boolean }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, emptyState);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, emptyState);
  const [prefsState, prefsAction, prefsPending] = useActionState(updatePreferencesAction, emptyState);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Profile</h1>
        <p className="mt-1 text-[14px] text-ink-2">Your account — separate from the workspace settings everyone shares.</p>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <p className="text-[13.5px] font-semibold text-ink-1">Edit profile</p>
        {storageConfigured ? (
          <FileUploadField kind="avatar" currentUrl={avatarUrl} label="Avatar" onUploaded={setAvatarUrl} />
        ) : null}
        <form action={profileAction} className="flex flex-col gap-4">
          <Field label="Display name" name="name" defaultValue={profile.name} />
          {!storageConfigured ? (
            <Field label="Avatar URL" name="avatarUrl" defaultValue={profile.avatarUrl ?? ""} />
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-2">Email</span>
            <input
              disabled
              defaultValue={profile.email}
              className="h-10 rounded-[9px] border border-line bg-surface-raised px-3 text-[13.5px] text-ink-3"
            />
            <span className="text-[11.5px] text-ink-3">Changing your email isn&rsquo;t available yet.</span>
          </label>
          <Button type="submit" variant="primary" className="w-fit" disabled={profilePending}>
            {profilePending ? "Saving…" : "Save changes"}
          </Button>
          <ActionMessage state={profileState} />
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <p className="text-[13.5px] font-semibold text-ink-1">Change password</p>
        <form action={passwordAction} className="flex flex-col gap-4">
          <Field label="Current password" name="currentPassword" defaultValue="" type="password" />
          <Field label="New password" name="newPassword" defaultValue="" type="password" />
          <Field label="Confirm new password" name="confirm" defaultValue="" type="password" />
          <Button type="submit" variant="primary" className="w-fit" disabled={passwordPending}>
            {passwordPending ? "Saving…" : "Change password"}
          </Button>
          <ActionMessage state={passwordState} />
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <p className="text-[13.5px] font-semibold text-ink-1">Notification preferences</p>
        <form action={prefsAction} className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 text-[13.5px] text-ink-1">
            <input type="checkbox" name="workspace" defaultChecked={profile.notificationPreferences.workspace} className="h-4 w-4" />
            Workspace events (invitations accepted, role changes)
          </label>
          <label className="flex items-center gap-2.5 text-[13.5px] text-ink-1">
            <input type="checkbox" name="security" defaultChecked={profile.notificationPreferences.security} className="h-4 w-4" />
            Account security events (password changes)
          </label>
          <Button type="submit" variant="secondary" className="w-fit" disabled={prefsPending}>
            {prefsPending ? "Saving…" : "Save preferences"}
          </Button>
          <ActionMessage state={prefsState} />
        </form>
      </Card>
    </div>
  );
}

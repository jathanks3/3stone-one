import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getProfile } from "@/server/services/profileService";
import { isStorageConfigured } from "@/server/services/storageService";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "Profile — 3Stone One" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-[14px] text-ink-2">Profile editing is part of a real account.</p>
        <p className="mt-1 text-[13px] text-ink-3">The live demo shares one identity for every visitor.</p>
      </div>
    );
  }

  const profile = await getProfile(session.userId);
  return <ProfileClient profile={profile} storageConfigured={isStorageConfigured()} />;
}

import type { Metadata } from "next";
import { previewInvitation } from "@/server/services/teamService";
import { ResetPasswordShell } from "../../reset-password/ResetPasswordShell";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const metadata: Metadata = { title: "Join workspace — 3Stone One" };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetPasswordShell title="Join a workspace">
        <p role="alert" className="text-center text-[13px] text-critical">
          This invitation link is missing its token.
        </p>
      </ResetPasswordShell>
    );
  }

  let preview: Awaited<ReturnType<typeof previewInvitation>>;
  try {
    preview = await previewInvitation(token);
  } catch (e) {
    return (
      <ResetPasswordShell title="Join a workspace">
        <p role="alert" className="text-center text-[13px] text-critical">
          {e instanceof Error ? e.message : "This invitation is invalid or has expired."}
        </p>
      </ResetPasswordShell>
    );
  }

  if (!preview.needsPassword) {
    return (
      <ResetPasswordShell title="Join a workspace">
        <p className="text-center text-[13.5px] text-ink-2">
          <span className="font-semibold text-ink-1">{preview.email}</span> already has a 3Stone One account.
        </p>
        <p className="mt-2 text-center text-[13px] text-ink-3">
          <a href="/login" className="font-medium text-accent hover:text-accent-strong">
            Log in
          </a>
          , then reopen this invite link.
        </p>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell
      title={`Join ${preview.workspaceName}`}
      subtitle={`You've been invited as ${preview.roleName}. Create a password to continue.`}
    >
      <AcceptInviteForm token={token} />
    </ResetPasswordShell>
  );
}

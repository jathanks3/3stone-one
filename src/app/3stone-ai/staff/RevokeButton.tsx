"use client";

import { useState, useTransition } from "react";
import { revokeStaffAction } from "./actions";

export function RevokeButton({ membershipId, userId }: { membershipId: string; userId: string }) {
  const [revoked, setRevoked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (revoked) return <span className="text-[12.5px] text-ink-3">Revoked</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await revokeStaffAction(membershipId, userId);
            if (result.error) setError(result.error);
            else setRevoked(true);
          })
        }
        className="h-8 rounded-[8px] border border-line-strong px-3 text-[12.5px] font-medium text-critical hover:bg-critical-wash disabled:opacity-60"
      >
        Revoke
      </button>
      {error ? <span className="text-[11.5px] text-critical">{error}</span> : null}
    </div>
  );
}

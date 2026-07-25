"use client";

import { useState, useTransition } from "react";
import { toggleFeatureFlagAction } from "./actions";

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !isEnabled;
    setIsEnabled(next);
    setError(null);
    startTransition(async () => {
      try {
        await toggleFeatureFlagAction(flagKey, next);
      } catch {
        setIsEnabled(!next);
        setError("Failed to update.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          isEnabled ? "bg-accent" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            isEnabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-[12.5px] text-ink-2">{isEnabled ? "Enabled" : "Disabled"}</span>
      {error ? <span className="text-[12px] text-critical">{error}</span> : null}
    </div>
  );
}

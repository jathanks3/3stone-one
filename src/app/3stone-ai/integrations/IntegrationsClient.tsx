"use client";

import { useActionState } from "react";
import { Badge } from "@/ui/Badge";
import type { IntegrationEntry, IntegrationStatus } from "@/server/platform/services/integrationCenterService";
import { testConnectionAction, type TestConnectionState } from "./actions";

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "Connected",
  setup_required: "Setup Required",
  missing_credentials: "Missing Credentials",
  needs_dns: "Needs DNS",
  authorization_expired: "Authorization Expired",
  error: "Error",
  disabled: "Disabled",
};

const STATUS_TONE: Record<IntegrationStatus, "good" | "warning" | "critical" | "neutral"> = {
  connected: "good",
  setup_required: "warning",
  missing_credentials: "warning",
  needs_dns: "warning",
  authorization_expired: "critical",
  error: "critical",
  disabled: "neutral",
};

const emptyState: TestConnectionState = {};

function TestConnectionButton({ serviceKey }: { serviceKey: string }) {
  const [state, formAction, pending] = useActionState(testConnectionAction, emptyState);
  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="key" value={serviceKey} />
      <button
        type="submit"
        disabled={pending}
        className="h-8 rounded-[7px] border border-line-strong bg-surface px-3 text-[12.5px] font-medium text-ink-1 hover:bg-surface-raised disabled:opacity-60"
      >
        {pending ? "Testing…" : "Test connection"}
      </button>
      {state.result ? (
        <p className={`text-[11.5px] ${state.result.ok ? "text-good" : "text-critical"}`}>{state.result.message}</p>
      ) : null}
    </form>
  );
}

function formatDate(date: Date | null) {
  return date ? date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never";
}

function IntegrationRow({ entry }: { entry: IntegrationEntry }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-ink-1">{entry.label}</p>
            <Badge tone={STATUS_TONE[entry.status]}>{STATUS_LABEL[entry.status]}</Badge>
          </div>
          <p className="mt-1 text-[12px] text-ink-3">{entry.category}</p>
          <p className="mt-2 max-w-xl text-[13px] text-ink-2">{entry.note}</p>
          {entry.requiredEnvVars.length > 0 ? (
            <p className="mt-2 text-[11.5px] text-ink-3">
              Environment variables required:{" "}
              <span className="font-mono">{entry.requiredEnvVars.join(", ")}</span>
              {/* Never the values — only the names, so the founder knows exactly
                  what to set without this page ever handling a secret itself. */}
            </p>
          ) : null}
          <div className="mt-2 flex gap-4 text-[11.5px] text-ink-3">
            <span>Last successful verification: {formatDate(entry.lastSuccessAt)}</span>
            {entry.lastErrorAt ? (
              <span className="text-critical">
                Last error: {formatDate(entry.lastErrorAt)}
                {entry.lastErrorMessage ? ` — ${entry.lastErrorMessage}` : ""}
              </span>
            ) : null}
          </div>
        </div>
        {entry.canTest ? <TestConnectionButton serviceKey={entry.key} /> : null}
      </div>
    </div>
  );
}

export function IntegrationsClient({ integrations }: { integrations: IntegrationEntry[] }) {
  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Integrations</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Every external service this app depends on, and its real, live-checked status — never hardcoded.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {integrations.map((entry) => (
          <IntegrationRow key={entry.key} entry={entry} />
        ))}
      </div>
    </div>
  );
}

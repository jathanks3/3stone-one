"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plug, Calendar } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import { disconnectGoogleAction, type ActionState } from "@/app/(app)/integrations/actions";

const emptyState: ActionState = {};

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "Only the workspace owner or an admin can connect integrations.",
  not_configured: "Google integration isn't configured yet.",
  access_denied: "Google connection was cancelled.",
  missing_code: "Something went wrong starting the Google connection. Try again.",
  session_mismatch: "That connection link was for a different session. Try connecting again.",
  connection_failed: "Couldn't complete the Google connection. Try again.",
};

const COMING_SOON = [
  { name: "Microsoft 365 & Teams", blurb: "Sync Outlook email, calendar, OneDrive documents, and Teams chat/meetings." },
  { name: "Zoom", blurb: "Create and join Zoom meetings straight from Meetings." },
  { name: "Canvas", blurb: "Pull real assignments and due dates from your school's Canvas." },
  { name: "Slack", blurb: "Mirror key channels and get notifications in Slack." },
  { name: "QuickBooks", blurb: "Revenue, expenses, and invoice status sync into Finance automatically." },
];

export function RealIntegrationsClient({
  googleConfigured,
  googleStatus,
  googleConnectedAt,
  googleEvents,
}: {
  googleConfigured: boolean;
  googleStatus: "connected" | "not_connected" | "error";
  googleConnectedAt: string | null;
  googleEvents: { summary: string; start: string }[] | null;
}) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [state, formAction, pending] = useActionState(disconnectGoogleAction, emptyState);

  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    if (error) {
      showToast({ title: "Couldn't connect", description: ERROR_MESSAGES[error] ?? "Something went wrong." });
    } else if (connected === "google") {
      showToast({ title: "Google connected", description: "Calendar, Gmail, Drive, and Sheets are now linked." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Integrations</h1>
      <p className="mt-1 max-w-[680px] text-[14px] text-ink-2">
        Connect the tools you already use. Real connections only — nothing here shows as connected unless it actually is.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-surface-raised">
                <Plug size={18} className="text-ink-2" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14.5px] font-semibold text-ink-1">Google Workspace</p>
                  <Badge tone={googleStatus === "connected" ? "good" : "neutral"}>
                    {googleStatus === "connected" ? "Connected" : "Not connected"}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] text-ink-2">Calendar, Gmail, Drive, and Sheets.</p>
                {googleStatus === "connected" && googleConnectedAt ? (
                  <p className="mt-1 text-[11.5px] text-ink-3">
                    Connected {new Date(googleConnectedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            </div>
            {googleStatus === "connected" ? (
              <form action={formAction}>
                <Button type="submit" variant="secondary" disabled={pending}>
                  {pending ? "Disconnecting…" : "Disconnect"}
                </Button>
              </form>
            ) : googleConfigured ? (
              <a href="/api/integrations/google/connect">
                <Button type="button" variant="primary">
                  Connect
                </Button>
              </a>
            ) : (
              <Button type="button" variant="primary" disabled>
                Connect
              </Button>
            )}
          </div>
          {state.error ? <p className="mt-3 text-[12px] text-critical">{state.error}</p> : null}

          {googleStatus === "connected" && googleEvents ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                <Calendar size={13} /> Next on your Google Calendar
              </p>
              {googleEvents.length === 0 ? (
                <p className="mt-2 text-[13px] text-ink-3">Nothing coming up.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {googleEvents.map((e, i) => (
                    <li key={i} className="text-[13px] text-ink-2">
                      {e.summary} — <span className="text-ink-3">{new Date(e.start).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </Card>
      </div>

      <p className="mt-8 mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">More on the way</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMING_SOON.map((item) => (
          <Card key={item.name} className="p-4 opacity-60">
            <p className="text-[13.5px] font-semibold text-ink-1">{item.name}</p>
            <p className="mt-1 text-[12.5px] text-ink-2">{item.blurb}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

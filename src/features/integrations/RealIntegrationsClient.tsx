"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plug, Calendar, ArrowUpRight } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useToast } from "@/lib/toast";
import { connectCanvasAction, disconnectCanvasAction, disconnectGoogleAction, disconnectMicrosoftAction, disconnectSlackAction, type ActionState } from "@/app/(app)/integrations/actions";
import { integrationsForEdition, type IntegrationReadiness } from "@/lib/integrationCatalog";

const emptyState: ActionState = {};

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "Only the workspace owner or an admin can connect integrations.",
  not_configured: "That integration isn't configured yet.",
  access_denied: "Connection was cancelled.",
  missing_code: "Something went wrong starting the connection. Try again.",
  session_mismatch: "That connection link was for a different session. Try connecting again.",
  connection_failed: "Couldn't complete the connection. Try again.",
};

type Status = "connected" | "not_connected" | "error";
type CalendarEvent = { summary: string; start: string };

function IntegrationCard({
  name,
  blurb,
  status,
  connectedAt,
  configured,
  connectHref,
  disconnectAction,
  events,
  eventsLabel,
}: {
  name: string;
  blurb: string;
  status: Status;
  connectedAt: string | null;
  configured: boolean;
  connectHref: string;
  disconnectAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  events: CalendarEvent[] | null;
  eventsLabel: string;
}) {
  const [state, formAction, pending] = useActionState(disconnectAction, emptyState);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-surface-raised">
            <Plug size={18} className="text-ink-2" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14.5px] font-semibold text-ink-1">{name}</p>
              <Badge tone={status === "connected" ? "good" : "neutral"}>
                {status === "connected" ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-ink-2">{blurb}</p>
            {status === "connected" && connectedAt ? (
              <p className="mt-1 text-[11.5px] text-ink-3">Connected {new Date(connectedAt).toLocaleDateString()}</p>
            ) : null}
          </div>
        </div>
        {status === "connected" ? (
          <form action={formAction}>
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Disconnecting…" : "Disconnect"}
            </Button>
          </form>
        ) : configured ? (
          <a href={connectHref}>
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

      {status === "connected" && events ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            <Calendar size={13} /> {eventsLabel}
          </p>
          {events.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-3">Nothing coming up.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {events.map((e, i) => (
                <li key={i} className="text-[13px] text-ink-2">
                  {e.summary} — <span className="text-ink-3">{new Date(e.start).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export function RealIntegrationsClient({
  googleConfigured,
  googleStatus,
  googleConnectedAt,
  googleEvents,
  microsoftConfigured,
  microsoftStatus,
  microsoftConnectedAt,
  microsoftEvents,
  editionKey,
  slackConfigured,
  slackStatus,
  slackConnectedAt,
  canvasStatus,
  canvasConnectedAt,
}: {
  googleConfigured: boolean;
  googleStatus: Status;
  googleConnectedAt: string | null;
  googleEvents: CalendarEvent[] | null;
  microsoftConfigured: boolean;
  microsoftStatus: Status;
  microsoftConnectedAt: string | null;
  microsoftEvents: CalendarEvent[] | null;
  editionKey: string;
  slackConfigured: boolean;
  slackStatus: Status;
  slackConnectedAt: string | null;
  canvasStatus: Status;
  canvasConnectedAt: string | null;
}) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const catalog = integrationsForEdition(editionKey);
  const [canvasState, canvasAction, canvasPending] = useActionState(connectCanvasAction, emptyState);
  const [canvasDisconnectState, canvasDisconnectAction, canvasDisconnectPending] = useActionState(disconnectCanvasAction, emptyState);
  const [canvasGuideOpen, setCanvasGuideOpen] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    if (error) {
      showToast({ title: "Couldn't connect", description: ERROR_MESSAGES[error] ?? "Something went wrong." });
    } else if (connected === "google") {
      showToast({ title: "Google connected", description: "Your Google Calendar is now linked." });
    } else if (connected === "microsoft") {
      showToast({ title: "Microsoft connected", description: "Your Outlook Calendar and Mail are now linked." });
    } else if (connected === "slack") {
      showToast({ title: "Slack connected", description: "Your Slack workspace is now linked." });
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
        <IntegrationCard
          name={editionKey === "student" ? "Google Drive" : "Google Workspace"}
          blurb={editionKey === "student" ? "Student connection requests Drive read access only." : "Gmail and Calendar populate Communications and Calendar; Business also enables Drive and Sheets."}
          status={googleStatus}
          connectedAt={googleConnectedAt}
          configured={googleConfigured}
          connectHref="/api/integrations/google/connect"
          disconnectAction={disconnectGoogleAction}
          events={editionKey === "student" ? null : googleEvents}
          eventsLabel="Next on your Google Calendar"
        />
        <IntegrationCard
          name={editionKey === "student" ? "Microsoft OneDrive" : "Microsoft 365"}
          blurb={editionKey === "student" ? "Student connection requests OneDrive file access only." : "Outlook Mail, Calendar, OneDrive and Teams populate their Workplace destinations."}
          status={microsoftStatus}
          connectedAt={microsoftConnectedAt}
          configured={microsoftConfigured}
          connectHref="/api/integrations/microsoft/connect"
          disconnectAction={disconnectMicrosoftAction}
          events={editionKey === "student" ? null : microsoftEvents}
          eventsLabel="Next on your Outlook Calendar"
        />
        {catalog.some((item) => item.key === "slack") ? (
          <IntegrationCard
            name="Slack"
            blurb="Real Slack channels and messages populate Communications."
            status={slackStatus}
            connectedAt={slackConnectedAt}
            configured={slackConfigured}
            connectHref="/api/integrations/slack/connect"
            disconnectAction={disconnectSlackAction}
            events={null}
            eventsLabel=""
          />
        ) : null}
        {catalog.some((item) => item.key === "canvas") ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14.5px] font-semibold text-ink-1">Canvas</p>
                  <Badge tone={canvasStatus === "connected" ? "good" : "neutral"}>{canvasStatus === "connected" ? "Connected" : "Not connected"}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-ink-2">Uses the student's school Canvas URL and personal access token. Upcoming assignments populate Calendar.</p>
                {canvasConnectedAt ? <p className="mt-1 text-[11.5px] text-ink-3">Connected {new Date(canvasConnectedAt).toLocaleDateString()}</p> : null}
              </div>
              {canvasStatus === "connected" ? (
                <form action={canvasDisconnectAction}><Button type="submit" variant="secondary" disabled={canvasDisconnectPending}>{canvasDisconnectPending ? "Disconnecting…" : "Disconnect"}</Button></form>
              ) : null}
            </div>
            {canvasStatus !== "connected" && !canvasGuideOpen ? (
              <div className="mt-4 border-t border-line pt-4">
                <Button type="button" variant="primary" onClick={() => setCanvasGuideOpen(true)}>Connect Canvas</Button>
              </div>
            ) : null}
            {canvasStatus !== "connected" && canvasGuideOpen ? (
              <div className="mt-4 border-t border-line pt-4">
                <div className="rounded-[12px] bg-surface-raised p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-ink-1">Connect your school Canvas account</p>
                      <p className="mt-1 text-[12.5px] text-ink-2">Your email is used to sign into your school—not sent to 3Stone One. Never enter your Canvas password here.</p>
                    </div>
                    <button type="button" onClick={() => setCanvasGuideOpen(false)} className="text-[12px] font-medium text-ink-3 hover:text-ink-1">Close</button>
                  </div>
                  <ol className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-ink-2">
                    <li><strong className="text-ink-1">1. Find your Canvas website.</strong> Open Canvas from your school portal or a Canvas course email. Copy the address through the school domain, such as <span className="font-mono text-[11.5px]">https://school.instructure.com</span> or <span className="font-mono text-[11.5px]">https://canvas.school.edu</span>.</li>
                    <li><strong className="text-ink-1">2. Sign in with your school account.</strong> Use the email, username, or student ID your institution requires. Complete school SSO or MFA if prompted.</li>
                    <li><strong className="text-ink-1">3. Open Account → Settings.</strong> In Canvas's left navigation, select <strong>Account</strong>, then <strong>Settings</strong>.</li>
                    <li><strong className="text-ink-1">4. Create a token.</strong> Scroll to <strong>Approved Integrations</strong>, choose <strong>+ New Access Token</strong>, enter <strong>3Stone One</strong> as the purpose, choose an expiration date if your school requires one, and select <strong>Generate Token</strong>.</li>
                    <li><strong className="text-ink-1">5. Copy it immediately.</strong> Canvas normally shows the complete token only once. Return here, paste the school URL and token below, then connect.</li>
                  </ol>
                  <p className="mt-3 rounded-[8px] border border-line px-3 py-2 text-[11.5px] text-ink-3">Don’t see “+ New Access Token”? Your institution disabled personal tokens. Contact its Canvas/IT help desk and ask whether student API access is permitted.</p>
                  <a href="https://community.canvaslms.com/html/assets/Canvas_Student_Guide.pdf" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[12px] font-semibold text-accent hover:underline">Open the official Canvas Student Guide</a>
                </div>
                <form action={canvasAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-[12px] font-medium text-ink-2">School Canvas URL<input name="baseUrl" type="url" required placeholder="https://school.instructure.com" aria-label="Canvas school URL" className="mt-1 w-full rounded-[9px] border border-line bg-surface px-3 py-2 text-[13px] text-ink-1" /></label>
                  <label className="text-[12px] font-medium text-ink-2">Personal access token<input name="accessToken" type="password" required placeholder="Paste the token Canvas showed once" aria-label="Canvas personal access token" className="mt-1 w-full rounded-[9px] border border-line bg-surface px-3 py-2 text-[13px] text-ink-1" /></label>
                  <Button type="submit" variant="primary" disabled={canvasPending} className="self-end">{canvasPending ? "Testing…" : "Connect securely"}</Button>
                </form>
              </div>
            ) : null}
            {(canvasState.error || canvasDisconnectState.error) ? <p className="mt-3 text-[12px] text-critical">{canvasState.error ?? canvasDisconnectState.error}</p> : null}
            {canvasState.success ? <p className="mt-3 text-[12px] text-positive">{canvasState.success}</p> : null}
          </Card>
        ) : null}
      </div>

      <p className="mt-8 mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Available for this edition</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {catalog.map((item) => (
          <Card key={item.key} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-ink-1">{item.name}</p>
              <Badge tone={item.readiness === "live" ? "good" : item.readiness === "configured" ? "accent" : "neutral"}>{readinessLabel(item.readiness)}</Badge>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{item.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.destinations.map((destination) => (
                <a key={`${item.key}-${destination.href}-${destination.label}`} href={destination.href} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-medium text-ink-2 hover:border-accent hover:text-accent">
                  {destination.label} <ArrowUpRight size={11} />
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function readinessLabel(readiness: IntegrationReadiness): string {
  if (readiness === "live") return "Live path";
  if (readiness === "configured") return "App configured";
  if (readiness === "approval_required") return "Vendor approval";
  return "In build";
}

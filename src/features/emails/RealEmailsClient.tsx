"use client";

import { Tabs } from "@/ui/Tabs";
import { MailTab } from "@/features/communications/MailTab";
import type { OutlookMessage } from "@/server/services/microsoftIntegrationService";

// Thin wrapper around the shared MailTab (see
// features/communications/MailTab.tsx) - same two-pane list/thread UI,
// real reply and real attachment preview/save used by Communications.
// Kept as its own page (rather than folded fully
// into Communications) because Business edition's unrestricted nav
// (editionModules.ts) still links here alongside Communications.
export function RealEmailsClient({
  outlookConnected,
  outlookMessages,
}: {
  outlookConnected: boolean;
  outlookMessages: OutlookMessage[] | null;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">📧 Emails</h1>
      <p className="mt-1 text-[14px] text-ink-2">Your connected Outlook inbox, read live from Microsoft — nothing here is copied or stored unless you save an attachment.</p>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "outlook", label: "Outlook Mail", content: <MailTab provider="microsoft" connected={outlookConnected} messages={outlookMessages} /> },
          ]}
        />
      </div>
    </div>
  );
}

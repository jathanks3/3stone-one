"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useToast } from "@/lib/toast";
import { DEMO_INTEGRATIONS, INTEGRATION_CATEGORY_ORDER } from "@/server/mock-data";
import type { IntegrationProvider } from "@/types";

export function IntegrationsClient() {
  const [providers, setProviders] = useState<IntegrationProvider[]>(DEMO_INTEGRATIONS);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { showToast } = useToast();

  function toggle(key: string) {
    const provider = providers.find((p) => p.key === key)!;
    if (provider.status === "connected") {
      setProviders((prev) => prev.map((p) => (p.key === key ? { ...p, status: "not_connected", lastSync: null } : p)));
      showToast({ title: `Disconnected ${provider.name}`, description: "You can reconnect any time." });
      return;
    }
    setConnecting(key);
    window.setTimeout(() => {
      setProviders((prev) => prev.map((p) => (p.key === key ? { ...p, status: "connected", lastSync: "Just now" } : p)));
      setConnecting(null);
      showToast({ title: `Connected to ${provider.name}`, description: provider.blurb });
    }, 900);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Integrations</h1>
      <p className="mt-1 max-w-[640px] text-[14px] text-ink-2">
        3Stone One doesn&rsquo;t replace QuickBooks, Stripe, or Slack — it brings the information that matters from
        each of them into one command center.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {INTEGRATION_CATEGORY_ORDER.map((category) => {
          const items = providers.filter((p) => p.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category}>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3">{category}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <Card key={p.key} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-accent-wash text-[12px] font-bold text-accent">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                        <p className="text-[14px] font-semibold text-ink-1">{p.name}</p>
                      </div>
                      <Badge tone={p.status === "connected" ? "good" : "neutral"}>
                        {p.status === "connected" ? "Connected" : "Not connected"}
                      </Badge>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-ink-3">{p.blurb}</p>
                    {p.lastSync ? <p className="text-[11.5px] text-ink-3">Last synced {p.lastSync}</p> : null}
                    <button
                      onClick={() => toggle(p.key)}
                      disabled={connecting === p.key}
                      className={
                        "mt-auto rounded-[9px] border px-3 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-70 " +
                        (p.status === "connected"
                          ? "border-line bg-surface text-ink-2 hover:bg-surface-raised"
                          : "border-accent bg-accent text-on-accent hover:opacity-90")
                      }
                    >
                      {connecting === p.key ? "Connecting…" : p.status === "connected" ? "Disconnect" : "Connect"}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-[12.5px] text-ink-3">
        <Plug size={14} />
        Don&rsquo;t see a tool you use? More integrations ship as customers ask for them.
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plug, Sparkles } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useToast } from "@/lib/toast";
import { DEMO_INTEGRATIONS, INTEGRATION_CATEGORY_ORDER } from "@/server/mock-data";
import type { IntegrationProvider } from "@/types";

export function IntegrationsClient() {
  const [providers, setProviders] = useState<IntegrationProvider[]>(DEMO_INTEGRATIONS);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { showToast } = useToast();

  function connect(key: string) {
    const provider = providers.find((p) => p.key === key)!;
    setConnecting(key);
    window.setTimeout(() => {
      setProviders((prev) => prev.map((p) => (p.key === key ? { ...p, status: "connected", lastSync: "Just now" } : p)));
      setConnecting(null);
      showToast({ title: `Connected to ${provider.name}`, description: provider.blurb });
    }, 900);
  }

  function disconnect(key: string) {
    const provider = providers.find((p) => p.key === key)!;
    setProviders((prev) => prev.map((p) => (p.key === key ? { ...p, status: "not_connected", lastSync: null } : p)));
    showToast({ title: `Disconnected ${provider.name}`, description: "You can reconnect any time." });
  }

  function transform(key: string) {
    const provider = providers.find((p) => p.key === key)!;
    setProviders((prev) => prev.map((p) => (p.key === key ? { ...p, status: "transformed", lastSync: null } : p)));
    showToast({
      title: `${provider.name} replaced by 3Stone One`,
      description: "Migration earned, not forced — you can revert to Connect any time.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Integrations</h1>
      <p className="mt-1 max-w-[680px] text-[14px] text-ink-2">
        Two ways to work with the tools you already use: <strong className="text-ink-1">Connect</strong> keeps
        them and brings their information into one command center. <strong className="text-ink-1">Transform</strong>{" "}
        replaces them with a native 3Stone One module when you&rsquo;re ready — migration is earned, never forced.
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
                      <Badge tone={p.status === "connected" ? "good" : p.status === "transformed" ? "accent" : "neutral"}>
                        {p.status === "connected" ? "Demo connection" : p.status === "transformed" ? "Native demo" : "Integration option"}
                      </Badge>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-ink-3">
                      {p.status === "transformed" ? `Replaced by 3Stone One's native module. ${p.blurb}` : p.blurb}
                    </p>
                    {p.lastSync ? <p className="text-[11.5px] text-ink-3">Last synced {p.lastSync}</p> : null}

                    <div className="mt-auto flex flex-col gap-1.5">
                      {p.status === "not_connected" ? (
                        <>
                          <button
                            onClick={() => connect(p.key)}
                            disabled={connecting === p.key}
                            className="rounded-[9px] border border-accent bg-accent px-3 py-2 text-[12.5px] font-semibold text-on-accent transition-colors hover:opacity-90 disabled:opacity-70"
                          >
                            {connecting === p.key ? "Preparing…" : "View example configuration"}
                          </button>
                          <button
                            onClick={() => transform(p.key)}
                            className="flex items-center justify-center gap-1 rounded-[9px] px-3 py-1.5 text-[12px] font-medium text-ink-3 hover:text-accent"
                          >
                            <Sparkles size={12} /> Transform to native instead
                          </button>
                        </>
                      ) : p.status === "connected" ? (
                        <>
                          <button
                            onClick={() => disconnect(p.key)}
                            className="rounded-[9px] border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink-2 transition-colors hover:bg-surface-raised"
                          >
                            Disconnect
                          </button>
                          <button
                            onClick={() => transform(p.key)}
                            className="flex items-center justify-center gap-1 rounded-[9px] px-3 py-1.5 text-[12px] font-medium text-ink-3 hover:text-accent"
                          >
                            <Sparkles size={12} /> Transform to native module
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => connect(p.key)}
                          className="rounded-[9px] border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink-2 transition-colors hover:bg-surface-raised"
                        >
                          Revert to Connect
                        </button>
                      )}
                    </div>
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

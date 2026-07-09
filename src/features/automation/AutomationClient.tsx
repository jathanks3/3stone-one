"use client";

import { useState } from "react";
import { ArrowDown, Clock, Play, Plus, Workflow as WorkflowIcon, X, Zap } from "lucide-react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { DEMO_WORKFLOWS, DEMO_WORKFLOW_RUNS } from "@/server/mock-data";
import type { WorkflowDefinition, WorkflowRun } from "@/types";

const ACTION_CATALOG: { label: string; detail: string }[] = [
  { label: "Create Customer", detail: "Create a CRM record for the organization" },
  { label: "Assign Sales Rep", detail: "Assign to the least-loaded rep on the team" },
  { label: "Schedule Meeting", detail: "Send a scheduling link for a discovery call" },
  { label: "Generate Welcome Email", detail: "Draft and send a welcome email" },
  { label: "Notify Team", detail: "Post an update to a Communications channel" },
  { label: "Send Reminder Email", detail: "Email a payment or follow-up reminder" },
  { label: "Generate Invoice", detail: "Create an invoice from the job's value" },
  { label: "Request Review", detail: "Send a review request to the client" },
];

export function AutomationClient() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(DEMO_WORKFLOWS);
  const [runs, setRuns] = useState<WorkflowRun[]>(DEMO_WORKFLOW_RUNS);
  const [activeId, setActiveId] = useState(workflows[0].id);
  const [runningNodeIndex, setRunningNodeIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  const active = workflows.find((w) => w.id === activeId)!;

  function toggleActive(id: string) {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)));
  }

  function addNode(label: string, detail: string) {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === activeId
          ? { ...w, nodes: [...w.nodes, { id: `${w.id}_n${w.nodes.length + 1}`, kind: "action", label, detail }] }
          : w
      )
    );
  }

  function addDelay(days: number) {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === activeId
          ? {
              ...w,
              nodes: [
                ...w.nodes,
                {
                  id: `${w.id}_n${w.nodes.length + 1}`,
                  kind: "delay",
                  label: `Wait ${days} day${days === 1 ? "" : "s"}`,
                  detail: "Pause before running the next step",
                  days,
                },
              ],
            }
          : w
      )
    );
  }

  function removeNode(nodeId: string) {
    setWorkflows((prev) => prev.map((w) => (w.id === activeId ? { ...w, nodes: w.nodes.filter((n) => n.id !== nodeId) } : w)));
  }

  async function runNow() {
    for (let i = 0; i < active.nodes.length; i++) {
      setRunningNodeIndex(i);
      await new Promise((r) => setTimeout(r, 350));
    }
    setRunningNodeIndex(null);
    const run: WorkflowRun = {
      id: `run_${Date.now()}`,
      workflowId: active.id,
      at: "Just now",
      status: "success",
      summary: `Ran "${active.name}" — all ${active.nodes.length} steps completed.`,
    };
    setRuns((prev) => [run, ...prev]);
    showToast({ title: "Workflow ran successfully", description: active.name });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">Automation</h1>
      <p className="mt-1 text-[14px] text-ink-2">A visual workflow builder for the busywork between systems.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_240px]">
        <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
          {workflows.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveId(w.id)}
              className={cn(
                "flex flex-shrink-0 flex-col gap-1 rounded-[12px] border px-3.5 py-3 text-left transition-colors lg:flex-shrink",
                activeId === w.id ? "border-accent bg-accent-wash" : "border-line bg-surface hover:bg-surface-raised"
              )}
            >
              <span className="text-[13px] font-semibold text-ink-1">{w.name}</span>
              <Badge tone={w.isActive ? "good" : "neutral"}>{w.isActive ? "Active" : "Inactive"}</Badge>
            </button>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-ink-1">{active.name}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(active.id)}
                className={cn(
                  "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                  active.isActive ? "justify-end bg-accent" : "justify-start bg-line"
                )}
                aria-label="Toggle active"
              >
                <span className="h-4 w-4 rounded-full bg-surface" />
              </button>
              <button
                onClick={runNow}
                disabled={runningNodeIndex !== null}
                className="flex items-center gap-1.5 rounded-[9px] bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
              >
                <Play size={13} /> {runningNodeIndex !== null ? "Running…" : "Run now"}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-0">
            {active.nodes.map((node, i) => (
              <div key={node.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "group relative w-full max-w-[380px] rounded-[12px] border px-4 py-3 transition-colors",
                    node.kind === "trigger"
                      ? "border-accent-wash-strong bg-accent-wash"
                      : node.kind === "delay"
                        ? "border-dashed border-line-strong bg-bg"
                        : "border-line bg-surface-raised",
                    runningNodeIndex === i && "ring-2 ring-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {node.kind === "trigger" ? (
                      <Zap size={14} className="text-accent" />
                    ) : node.kind === "delay" ? (
                      <Clock size={14} className="text-ink-3" />
                    ) : (
                      <WorkflowIcon size={14} className="text-ink-3" />
                    )}
                    <p className="text-[13px] font-semibold text-ink-1">{node.label}</p>
                    {node.kind !== "trigger" ? (
                      <button
                        onClick={() => removeNode(node.id)}
                        className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove step"
                      >
                        <X size={13} className="text-ink-3 hover:text-critical" />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] text-ink-3">{node.detail}</p>
                </div>
                {i < active.nodes.length - 1 ? <ArrowDown size={16} className="my-1 text-ink-3" /> : null}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Add a delay</p>
            <div className="flex gap-1.5">
              {[1, 3, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => addDelay(days)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-line-strong bg-surface px-2 py-2 text-[12.5px] font-medium text-ink-2 hover:bg-surface-raised"
                >
                  <Clock size={13} className="flex-shrink-0 text-ink-3" />
                  {days}d
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Add an action</p>
            <div className="flex flex-col gap-1.5">
              {ACTION_CATALOG.map((a) => (
                <button
                  key={a.label}
                  onClick={() => addNode(a.label, a.detail)}
                  className="flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 text-left text-[12.5px] font-medium text-ink-2 hover:bg-surface-raised"
                >
                  <Plus size={13} className="flex-shrink-0 text-accent" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-[13px] font-semibold text-ink-2">Run history</p>
        <div className="flex flex-col gap-2">
          {runs
            .filter((r) => r.workflowId === activeId)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-2.5">
                <span className="text-[13px] text-ink-2">{r.summary}</span>
                <div className="flex items-center gap-3">
                  <Badge tone={r.status === "success" ? "good" : "critical"}>{r.status}</Badge>
                  <span className="text-[12px] text-ink-3">{r.at}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

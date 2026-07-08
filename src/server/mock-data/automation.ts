import type { WorkflowDefinition, WorkflowRun } from "@/types";

export const DEMO_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf_new_lead",
    name: "New Lead Onboarding",
    isActive: true,
    nodes: [
      { id: "n1", kind: "trigger", label: "New Lead", detail: "When a new lead is added to the pipeline" },
      { id: "n2", kind: "action", label: "Create Customer", detail: "Create a CRM record for the organization" },
      { id: "n3", kind: "action", label: "Assign Sales Rep", detail: "Assign to the least-loaded rep on the team" },
      { id: "n4", kind: "action", label: "Schedule Meeting", detail: "Send a scheduling link for a discovery call" },
      { id: "n5", kind: "action", label: "Generate Welcome Email", detail: "Draft and send a welcome email" },
      { id: "n6", kind: "action", label: "Notify Team", detail: "Post to #sales in Communications" },
    ],
  },
  {
    id: "wf_overdue_invoice",
    name: "Overdue Invoice Reminder",
    isActive: true,
    nodes: [
      { id: "n7", kind: "trigger", label: "Invoice Overdue", detail: "When an invoice passes its due date unpaid" },
      { id: "n8", kind: "action", label: "Send Reminder Email", detail: "Email the client a payment reminder" },
      { id: "n9", kind: "action", label: "Notify Account Owner", detail: "Notify the assigned team member" },
    ],
  },
  {
    id: "wf_job_complete",
    name: "Job Completion Follow-up",
    isActive: false,
    nodes: [
      { id: "n10", kind: "trigger", label: "Job Marked Done", detail: "When a job's status changes to Done" },
      { id: "n11", kind: "action", label: "Generate Final Invoice", detail: "Create the final invoice from job value" },
      { id: "n12", kind: "action", label: "Request Review", detail: "Send a review request to the client" },
    ],
  },
];

export const DEMO_WORKFLOW_RUNS: WorkflowRun[] = [
  { id: "run_1", workflowId: "wf_new_lead", at: "Today, 9:14 AM", status: "success", summary: "Ran for Nora Islam (Northgate Holdings) — assigned to Priya Shah, welcome email sent." },
  { id: "run_2", workflowId: "wf_new_lead", at: "Yesterday, 4:02 PM", status: "success", summary: "Ran for Ben Carter (Bayview Construction Partners) — assigned to Priya Shah." },
  { id: "run_3", workflowId: "wf_overdue_invoice", at: "Today, 6:00 AM", status: "success", summary: "Ran for INV-1038 (Smith Co.) — reminder email sent, Jane Dorsey notified." },
  { id: "run_4", workflowId: "wf_new_lead", at: "3 days ago", status: "failed", summary: "Ran for Tom Reilly — welcome email failed to send (invalid address format), auto-retried successfully." },
  { id: "run_5", workflowId: "wf_overdue_invoice", at: "1 week ago", status: "success", summary: "Ran for INV-1029 (Oakwood Logistics) — reminder sent, paid same day." },
];

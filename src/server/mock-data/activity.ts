import type { ActivityItem, NotificationItem } from "@/types";

export const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "act_1", message: "Riverside Properties signed the remodel contract", actor: "Jane Dorsey", timestamp: "2 days ago", kind: "deal", module: "CRM" },
  { id: "act_2", message: "4 new leads added to the pipeline", actor: "Priya Shah", timestamp: "This morning", kind: "deal", module: "CRM" },
  { id: "act_3", message: "9 tasks marked complete this week", actor: "Field Team", timestamp: "Today", kind: "task", module: "Projects" },
  { id: "act_4", message: "Priya Shah started as Lead Estimator", actor: "Sam Okafor", timestamp: "3 days ago", kind: "hire", module: "People" },
  { id: "act_5", message: "Invoice INV-1038 (Smith Co.) is now 9 days overdue", actor: "System", timestamp: "Today", kind: "invoice", module: "Finance" },
  { id: "act_6", message: "Uploaded Riverside-Progress-Photos-Jun.zip", actor: "Marcus Webb", timestamp: "3 days ago", kind: "document", module: "Documents" },
  { id: "act_7", message: "Scheduled: Riverside Kickoff Walkthrough", actor: "Jane Dorsey", timestamp: "4 days ago", kind: "meeting", module: "Meetings" },
  { id: "act_8", message: "Sent 3 messages in #sales", actor: "Priya Shah", timestamp: "Today", kind: "message", module: "Communications" },
  { id: "act_9", message: "Job status changed to In Progress — Fifth Avenue Retail Fit-out", actor: "Diego Ramirez", timestamp: "5 days ago", kind: "job", module: "Projects" },
  { id: "act_10", message: "Workflow \"New Lead Onboarding\" ran for Nora Islam", actor: "Automation", timestamp: "Today", kind: "automation", module: "Automation" },
  { id: "act_11", message: "Purchase request approved — scaffold rental extension", actor: "Alex Rivera", timestamp: "Yesterday", kind: "approval", module: "Finance" },
  { id: "act_12", message: "Job marked Done — Oakwood Warehouse Roof", actor: "Taylor Brooks", timestamp: "1 week ago", kind: "job", module: "Projects" },
  { id: "act_13", message: "Invoice INV-1029 (Oakwood Logistics) paid in full", actor: "System", timestamp: "1 week ago", kind: "invoice", module: "Finance" },
  { id: "act_14", message: "Posted announcement: Q2 numbers are in", actor: "Morgan Lee", timestamp: "1 week ago", kind: "message", module: "People" },
  { id: "act_15", message: "Added Bayview Construction Partners as a new lead", actor: "Priya Shah", timestamp: "Yesterday", kind: "deal", module: "CRM" },
  { id: "act_16", message: "Uploaded Harbor-View-Proposal.pdf", actor: "Priya Shah", timestamp: "2 weeks ago", kind: "document", module: "Documents" },
  { id: "act_17", message: "Workflow \"Overdue Invoice Reminder\" ran for INV-1038", actor: "Automation", timestamp: "Today", kind: "automation", module: "Automation" },
  { id: "act_18", message: "Call logged with Ben Carter — Bayview Construction Partners", actor: "Priya Shah", timestamp: "Yesterday", kind: "message", module: "Communications" },
  { id: "act_19", message: "Deal moved to Negotiation — Cedar Hills Custom Home", actor: "Priya Shah", timestamp: "2 days ago", kind: "deal", module: "CRM" },
  { id: "act_20", message: "Meeting completed: Monthly Financial Review", actor: "Alex Rivera", timestamp: "1 week ago", kind: "meeting", module: "Meetings" },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif_1", title: "Contract signed", body: "Riverside Properties signed the remodel contract.", timestamp: "2d ago", read: false },
  { id: "notif_2", title: "Invoice overdue", body: "INV-1038 (Smith Co.) is 9 days overdue.", timestamp: "3h ago", read: false },
  { id: "notif_3", title: "Purchase request", body: "Marcus Webb requested $2,400 for tools.", timestamp: "5h ago", read: false },
  { id: "notif_4", title: "Task assigned", body: "“Submit final inspection request” assigned to Marcus.", timestamp: "1d ago", read: true },
];

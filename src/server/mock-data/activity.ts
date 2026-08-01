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
  { id: "act_11", message: "Purchase request approved — scaffold rental extension", actor: "Jordan Ellis", timestamp: "Yesterday", kind: "approval", module: "Finance" },
  { id: "act_12", message: "Job marked Done — Oakwood Warehouse Roof", actor: "Taylor Brooks", timestamp: "1 week ago", kind: "job", module: "Projects" },
  { id: "act_13", message: "Invoice INV-1029 (Oakwood Logistics) paid in full", actor: "System", timestamp: "1 week ago", kind: "invoice", module: "Finance" },
  { id: "act_14", message: "Posted announcement: Q2 numbers are in", actor: "Morgan Lee", timestamp: "1 week ago", kind: "message", module: "People" },
  { id: "act_15", message: "Added Bayview Construction Partners as a new lead", actor: "Priya Shah", timestamp: "Yesterday", kind: "deal", module: "CRM" },
  { id: "act_16", message: "Uploaded Harbor-View-Proposal.pdf", actor: "Priya Shah", timestamp: "2 weeks ago", kind: "document", module: "Documents" },
  { id: "act_17", message: "Workflow \"Overdue Invoice Reminder\" ran for INV-1038", actor: "Automation", timestamp: "Today", kind: "automation", module: "Automation" },
  { id: "act_18", message: "Call logged with Ben Carter — Bayview Construction Partners", actor: "Priya Shah", timestamp: "Yesterday", kind: "message", module: "Communications" },
  { id: "act_19", message: "Deal moved to Negotiation — Cedar Hills Custom Home", actor: "Priya Shah", timestamp: "2 days ago", kind: "deal", module: "CRM" },
  { id: "act_20", message: "Meeting completed: Monthly Financial Review", actor: "Jordan Ellis", timestamp: "1 week ago", kind: "meeting", module: "Meetings" },
];

// Demo-only "Recent activity" feed for the Workspace edition
// (/demo?edition=workspace - see server/mock-data/industries/workplace.ts).
// Separate from DEMO_ACTIVITY above so the demo doesn't show identical
// construction/CRM-invoice-flavored entries regardless of which edition
// is being previewed - no "invoice"/"automation" kinds here, since
// Finance and Automation aren't in this edition (src/lib/editionModules.ts).
export const WORKPLACE_ACTIVITY: ActivityItem[] = [
  { id: "wact_1", message: "Atlas Health Partners approved the revised timeline", actor: "Jordan Ellis", timestamp: "2 days ago", kind: "deal", module: "CRM" },
  { id: "wact_2", message: "2 new leads added to the pipeline", actor: "Alicia Ford", timestamp: "This morning", kind: "deal", module: "CRM" },
  { id: "wact_3", message: "9 tasks marked complete this week", actor: "Consulting Team", timestamp: "Today", kind: "task", module: "Projects" },
  { id: "wact_4", message: "Ryan Ostrowski started as Associate Consultant", actor: "Maya Patel", timestamp: "3 days ago", kind: "hire", module: "People" },
  { id: "wact_5", message: "Uploaded Atlas-Website-Wireframes-v2.pdf", actor: "Ryan Ostrowski", timestamp: "3 days ago", kind: "document", module: "Documents" },
  { id: "wact_6", message: "Scheduled: Northstar Kickoff", actor: "Jordan Ellis", timestamp: "4 days ago", kind: "meeting", module: "Meetings" },
  { id: "wact_7", message: "Sent 3 messages in #client-updates", actor: "Alicia Ford", timestamp: "Today", kind: "message", module: "Communications" },
  { id: "wact_8", message: "Engagement status changed to In Progress — Summit Q3 Market Research", actor: "Alicia Ford", timestamp: "5 days ago", kind: "job", module: "Projects" },
  { id: "wact_9", message: "Engagement marked Done — Cascade HR Policy Refresh", actor: "Priya Nair", timestamp: "1 week ago", kind: "job", module: "Projects" },
  { id: "wact_10", message: "Posted announcement: Q2 client satisfaction scores are in", actor: "Priya Nair", timestamp: "1 week ago", kind: "message", module: "People" },
  { id: "wact_11", message: "Added Grace Simmons as a new lead", actor: "Jordan Ellis", timestamp: "Yesterday", kind: "deal", module: "CRM" },
  { id: "wact_12", message: "Meeting completed: Weekly Team Sync", actor: "Jordan Ellis", timestamp: "1 week ago", kind: "meeting", module: "Meetings" },
];

// Demo-only "Recent activity" feed for the Student edition
// (/demo?edition=student - see server/mock-data/industries/student.ts).
// No "deal"/"invoice"/"hire"/"automation"/"approval" kinds - none of CRM,
// Finance, People, or Automation exist in this edition. Also deliberately
// no "Meetings"/"Communications" module references - neither is in
// EDITION_MODULES.student (see src/lib/editionModules.ts); a student's
// group work shows up via Calendar, GPA, and Job Tracker instead.
export const STUDENT_ACTIVITY: ActivityItem[] = [
  { id: "sact_1", message: "Submitted the Capstone Proposal draft for review", actor: "You", timestamp: "2 days ago", kind: "document", module: "Documents" },
  { id: "sact_2", message: "5 assignments marked complete this week", actor: "You", timestamp: "Today", kind: "task", module: "Projects" },
  { id: "sact_3", message: "Added Marketing 401 Group Study Session to Calendar", actor: "You", timestamp: "4 days ago", kind: "job", module: "Calendar" },
  { id: "sact_4", message: "Added Organic Chemistry Lab Report course to GPA Calculator", actor: "You", timestamp: "Today", kind: "task", module: "GPA Calculator" },
  { id: "sact_5", message: "Assignment status changed to In Progress — Capstone Proposal", actor: "You", timestamp: "5 days ago", kind: "job", module: "Projects" },
  { id: "sact_6", message: "Uploaded Lecture-Notes-Week9.pdf", actor: "You", timestamp: "3 days ago", kind: "document", module: "Documents" },
  { id: "sact_7", message: "Assignment marked Submitted — Statistics Final Exam Prep", actor: "You", timestamp: "1 week ago", kind: "job", module: "Projects" },
  { id: "sact_8", message: "Moved Cedar & Co. application to Interviewing", actor: "You", timestamp: "1 week ago", kind: "task", module: "Job Tracker" },
  { id: "sact_9", message: "Uploaded Group-Project-Outline.docx", actor: "You", timestamp: "2 weeks ago", kind: "document", module: "Documents" },
  { id: "sact_10", message: "Pinned note: Stats midterm — study list", actor: "You", timestamp: "Yesterday", kind: "document", module: "Notes" },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif_1", title: "Contract signed", body: "Riverside Properties signed the remodel contract.", timestamp: "2d ago", read: false },
  { id: "notif_2", title: "Invoice overdue", body: "INV-1038 (Smith Co.) is 9 days overdue.", timestamp: "3h ago", read: false },
  { id: "notif_3", title: "Purchase request", body: "Marcus Webb requested $2,400 for tools.", timestamp: "5h ago", read: false },
  { id: "notif_4", title: "Task assigned", body: "“Submit final inspection request” assigned to Marcus.", timestamp: "1d ago", read: true },
];

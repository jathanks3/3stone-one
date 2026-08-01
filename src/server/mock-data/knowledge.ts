import type { KnowledgeArticle } from "@/types";

export const DEMO_ARTICLES: KnowledgeArticle[] = [
  {
    id: "kb_1",
    title: "Job Site Safety Check-in Process",
    category: "sop",
    author: "Sam Okafor",
    updatedAt: "2026-07-01",
    body: "All field staff must check in via the site log at the start and end of every shift, noting crew present, equipment on site, and any hazards observed. Site leads review the log weekly. Non-compliance is flagged to the department lead.",
  },
  {
    id: "kb_2",
    title: "Client Onboarding Checklist",
    category: "process",
    author: "Jane Dorsey",
    updatedAt: "2026-06-18",
    body: "1. Send welcome email within 24 hours of contract signing. 2. Schedule kickoff walkthrough within 5 business days. 3. Confirm site access, gate codes, and point of contact. 4. Share project timeline and milestone schedule. 5. Add client to the shared communications channel.",
  },
  {
    id: "kb_3",
    title: "Invoice Collection Process",
    category: "process",
    author: "Morgan Lee",
    updatedAt: "2026-05-22",
    body: "Invoices are sent upon milestone completion. A reminder is sent 3 days before due date, and again on the due date if unpaid. Invoices over 7 days overdue are escalated to the account owner for a personal follow-up call.",
  },
  {
    id: "kb_4",
    title: "Employee Handbook — PTO Policy",
    category: "policy",
    author: "Sam Okafor",
    updatedAt: "2026-01-10",
    body: "Full-time employees accrue 1.5 days of PTO per month, up to a maximum of 18 days per year. PTO requests should be submitted at least 2 weeks in advance via the Employee Portal where possible.",
  },
  {
    id: "kb_5",
    title: "Equipment & Tool Purchase Requests",
    category: "process",
    author: "Morgan Lee",
    updatedAt: "2026-06-30",
    body: "Purchases under $500 can be approved by a department lead. Purchases over $500 require Owner approval through the Finance module's Purchase Requests queue. All requests should include a brief justification.",
  },
  {
    id: "kb_6",
    title: "New Hire Onboarding — Field Staff",
    category: "training",
    author: "Sam Okafor",
    updatedAt: "2026-04-02",
    body: "New field hires complete a 2-day safety orientation before their first job site visit, including PPE fitting, equipment training, and a site safety walkthrough with their assigned mentor.",
  },
  {
    id: "kb_7",
    title: "Change Order Approval Process",
    category: "process",
    author: "Priya Shah",
    updatedAt: "2026-06-10",
    body: "Any scope change over $1,000 requires a written change order signed by the client before work proceeds. Estimating drafts the change order; the Project Manager obtains signature and files it with the job's documents.",
  },
  {
    id: "kb_8",
    title: "Using the Estimating Template",
    category: "training",
    author: "Priya Shah",
    updatedAt: "2026-03-15",
    body: "Walkthrough video covering how to build a bid using the standard estimating template, including materials markup, labor rates by role, and contingency guidelines.",
  },
  {
    id: "kb_9",
    title: "Vendor Code of Conduct",
    category: "policy",
    author: "Sam Okafor",
    updatedAt: "2026-02-08",
    body: "All vendors and subcontractors are expected to carry current insurance, follow job site safety protocols, and adhere to the project schedule. Violations should be reported to the Office Manager.",
  },
  {
    id: "kb_10",
    title: "Site Safety Orientation (Video)",
    category: "video",
    author: "Sam Okafor",
    updatedAt: "2026-01-20",
    body: "12-minute orientation video covering PPE requirements, equipment operation basics, and emergency procedures. Required viewing for all new field hires before their first site visit.",
  },
];

export const KNOWLEDGE_CATEGORY_LABEL: Record<KnowledgeArticle["category"], string> = {
  policy: "Policies",
  training: "Training",
  process: "Processes",
  sop: "SOPs",
  video: "Videos",
};

// Workspace edition's own articles (Harper & Voss Consulting) - process
// and policy content for a services/consulting team, not job-site SOPs.
export const WORKSPACE_ARTICLES: KnowledgeArticle[] = [
  {
    id: "wkb_1",
    title: "Client Onboarding Checklist",
    category: "process",
    author: "Jordan Ellis",
    updatedAt: "2026-06-18",
    body: "1. Send welcome email within 24 hours of contract signing. 2. Schedule kickoff call within 5 business days. 3. Confirm point of contact and communication cadence. 4. Share the engagement plan and milestone schedule. 5. Add client to the shared portal.",
  },
  {
    id: "wkb_2",
    title: "Weekly Status Report Template",
    category: "process",
    author: "Alicia Ford",
    updatedAt: "2026-06-30",
    body: "Every active engagement gets a short weekly status note: what shipped, what's blocked, what's next. Keep it under 200 words - clients read these on their phones.",
  },
  {
    id: "wkb_3",
    title: "Employee Handbook — PTO Policy",
    category: "policy",
    author: "Priya Nair",
    updatedAt: "2026-01-10",
    body: "Full-time staff accrue 1.5 days of PTO per month, up to a maximum of 18 days per year. Submit requests at least 2 weeks in advance through Time Off.",
  },
  {
    id: "wkb_4",
    title: "New Hire Onboarding — Consulting Team",
    category: "training",
    author: "Priya Nair",
    updatedAt: "2026-04-02",
    body: "New consultants shadow two live client calls and complete the engagement-plan template before being staffed on their first solo project.",
  },
  {
    id: "wkb_5",
    title: "Proposal Writing Guide",
    category: "training",
    author: "Jordan Ellis",
    updatedAt: "2026-03-15",
    body: "Walkthrough covering how to scope a proposal: discovery questions to ask, how to estimate hours by workstream, and standard pricing tiers.",
  },
  {
    id: "wkb_6",
    title: "Vendor & Contractor Code of Conduct",
    category: "policy",
    author: "Maya Patel",
    updatedAt: "2026-02-08",
    body: "Freelance contractors working on client engagements are expected to sign an NDA, follow client communication guidelines, and log hours weekly.",
  },
];

// Student edition's own articles - study resources and group-project
// references, not a company wiki.
export const STUDENT_ARTICLES: KnowledgeArticle[] = [
  {
    id: "skb_1",
    title: "Capstone Proposal Format Guide",
    category: "process",
    author: "You",
    updatedAt: "2026-07-15",
    body: "Section order: problem statement, literature review, methodology, timeline, expected outcomes. Committee wants 12-15 pages, double-spaced, APA citations.",
  },
  {
    id: "skb_2",
    title: "Group Project Norms — Marketing 401",
    category: "process",
    author: "You",
    updatedAt: "2026-07-10",
    body: "Weekly check-in every Tuesday. Shared doc for notes, not group chat. Whoever presents section 1 also owns the final slide review.",
  },
  {
    id: "skb_3",
    title: "Citation Style Cheat Sheet",
    category: "sop",
    author: "You",
    updatedAt: "2026-05-01",
    body: "APA: Author (Year). Title. Source. MLA: Author. \"Title.\" Source, Year. Check the syllabus - professors don't all default to the same style.",
  },
  {
    id: "skb_4",
    title: "Study Group Schedule Template",
    category: "training",
    author: "You",
    updatedAt: "2026-06-01",
    body: "Block 90-minute sessions, one topic per session, one person brings practice problems. Rotate who leads each week so prep isn't all on one person.",
  },
];

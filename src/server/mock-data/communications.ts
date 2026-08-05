import type { CallNote, EmailThread } from "@/types";

export const DEMO_EMAIL_THREADS: EmailThread[] = [
  {
    id: "thread_1",
    subject: "Riverside Remodel — kickoff schedule",
    withOrganizationId: "org_riverside",
    participant: "Sarah Chen",
    unread: true,
    messages: [
      { id: "m1", from: "Sarah Chen", body: "Hi Jane — excited to get started! Can we lock in a kickoff date for next week?", at: "2 days ago" },
      { id: "m2", from: "Jane Dorsey", body: "Absolutely — how does Tuesday at 10am work? We'll walk the site with the crew.", at: "2 days ago" },
      { id: "m3", from: "Sarah Chen", body: "Tuesday works great, see you then.", at: "1 day ago" },
    ],
  },
  {
    id: "thread_2",
    subject: "Smith Co. — signage delay",
    withOrganizationId: "org_smith",
    participant: "Robert Kim",
    unread: true,
    messages: [
      { id: "m4", from: "Robert Kim", body: "Hey Jane, just checking in — we haven't heard about the signage timeline in a bit.", at: "3 days ago" },
      { id: "m5", from: "Jane Dorsey", body: "Sorry for the delay, Robert — the sign vendor pushed us a week. New install date is the 25th.", at: "2 days ago" },
    ],
  },
  {
    id: "thread_3",
    subject: "Downtown Lofts — rooftop deck sign-off",
    withOrganizationId: "org_downtown",
    participant: "Elena Vasquez",
    unread: false,
    messages: [
      { id: "m6", from: "Elena Vasquez", body: "The board would like to review the rooftop deck plans before framing starts.", at: "1 week ago" },
      { id: "m7", from: "Jane Dorsey", body: "Sending the latest set over now — let me know if the board has questions.", at: "6 days ago" },
    ],
  },
  {
    id: "thread_4",
    subject: "Harbor View — steel order confirmation",
    withOrganizationId: "org_harbor",
    participant: "David Park",
    unread: false,
    messages: [
      { id: "m8", from: "Priya Shah", body: "Confirming the structural steel order is in — delivery expected week of the 28th.", at: "4 days ago" },
      { id: "m9", from: "David Park", body: "Great, thanks for the update Priya.", at: "3 days ago" },
    ],
  },
  {
    id: "thread_5",
    subject: "Cedar Hills — custom home walkthrough",
    withOrganizationId: "org_whitfield",
    participant: "Rachel Whitfield",
    unread: true,
    messages: [
      { id: "m10", from: "Rachel Whitfield", body: "We'd love to walk through the design one more time before signing — are you free this week?", at: "Today" },
    ],
  },
  {
    id: "thread_6",
    subject: "Bayview Construction Partners — introduction",
    withOrganizationId: "org_bayview",
    participant: "Ben Carter",
    unread: false,
    messages: [
      { id: "m11", from: "Ben Carter", body: "Thanks for the call yesterday — sending over our warehouse specs as promised.", at: "Yesterday" },
      { id: "m12", from: "Priya Shah", body: "Got them, reviewing now — will have a rough estimate back to you by Friday.", at: "Yesterday" },
    ],
  },
];

export const DEMO_CALL_NOTES: CallNote[] = [
  { id: "call_1", contactName: "Sarah Chen", organizationId: "org_riverside", authorId: "emp_jane", summary: "Discussed kickoff logistics and crew access to the clubhouse. Sarah will provide gate codes by Monday.", at: "2 days ago" },
  { id: "call_2", contactName: "Robert Kim", organizationId: "org_smith", authorId: "emp_jane", summary: "Explained signage vendor delay. Robert was understanding, asked for a written timeline update.", at: "2 days ago" },
  { id: "call_3", contactName: "Ben Carter", organizationId: "org_bayview", authorId: "emp_priya", summary: "Intro call — warehouse retrofit scope, budget range $80-90K, timeline flexible. Strong fit for Q4.", at: "Yesterday" },
  { id: "call_4", contactName: "Nora Islam", organizationId: "org_northgate", authorId: "emp_priya", summary: "Walked through office renovation requirements. Nora wants a proposal with two design options.", at: "Today" },
  { id: "call_5", contactName: "David Park", organizationId: "org_harbor", authorId: "emp_priya", summary: "Confirmed steel delivery timeline, no concerns raised. Quick, positive call.", at: "3 days ago" },
  { id: "call_6", contactName: "Rachel Whitfield", organizationId: "org_whitfield", authorId: "emp_priya", summary: "Discussed final design tweaks ahead of contract signing — requested one more walkthrough.", at: "Today" },
];

// Student walkthroughs need school-life communication, not the Business
// construction pipeline used by the flagship demo. Keep this separate so a
// custom Student link always remains convincing even when its industry is
// customized by the founder.
export const STUDENT_EMAIL_THREADS: EmailThread[] = [
  {
    id: "sthread_1",
    subject: "Biology 210 — study guide and review session",
    withOrganizationId: "student_biology_210",
    participant: "Prof. Maya Thompson",
    unread: true,
    messages: [
      { id: "sm1", from: "Prof. Maya Thompson", body: "I posted the midterm study guide. Our review session is Thursday at 4:00 PM in Science Hall 204.", at: "Yesterday" },
      { id: "sm2", from: "You", body: "Thank you! I will bring my questions from chapters 5 and 6.", at: "Yesterday" },
    ],
  },
  {
    id: "sthread_2",
    subject: "Group presentation — final slide assignments",
    withOrganizationId: "student_group_project",
    participant: "Jordan Lee",
    unread: true,
    messages: [
      { id: "sm3", from: "Jordan Lee", body: "I finished the research slides. Can you handle the conclusion and upload the final deck before Tuesday?", at: "Today" },
    ],
  },
  {
    id: "sthread_3",
    subject: "Summer internship application update",
    withOrganizationId: "student_career_center",
    participant: "Career Services",
    unread: false,
    messages: [
      { id: "sm4", from: "Career Services", body: "Your resume review is complete. We added comments before you submit the Northline Analytics application on Friday.", at: "2 days ago" },
      { id: "sm5", from: "You", body: "Got it — I will make the edits and send the updated version tomorrow.", at: "2 days ago" },
    ],
  },
];

// Workspace edition's own communications (Harper & Voss Consulting) -
// see jobs.ts's WORKSPACE_JOBS, organizations.ts's WORKSPACE_ORGANIZATIONS,
// and people.ts's WORKSPACE_EMPLOYEES.
export const WORKSPACE_EMAIL_THREADS: EmailThread[] = [
  {
    id: "wthread_1",
    subject: "Northstar Brand Strategy — kickoff schedule",
    withOrganizationId: "worg_northstar",
    participant: "Natalie Cho",
    unread: true,
    messages: [
      { id: "wm1", from: "Natalie Cho", body: "Hi Jordan — excited to get started! Can we lock in a kickoff call for next week?", at: "2 days ago" },
      { id: "wm2", from: "Jordan Ellis", body: "Absolutely — how does Tuesday at 10am work? We'll walk through the full engagement plan.", at: "2 days ago" },
      { id: "wm3", from: "Natalie Cho", body: "Tuesday works great, talk then.", at: "1 day ago" },
    ],
  },
  {
    id: "wthread_2",
    subject: "Atlas Website Redesign — timeline update",
    withOrganizationId: "worg_atlas",
    participant: "Omar Hassan",
    unread: true,
    messages: [
      { id: "wm4", from: "Omar Hassan", body: "Hey Jordan, just checking in on the homepage mockups timeline.", at: "3 days ago" },
      { id: "wm5", from: "Ryan Ostrowski", body: "Sorry for the delay, Omar — sending the revised mockups by end of week.", at: "2 days ago" },
    ],
  },
  {
    id: "wthread_3",
    subject: "Beacon Ops Review — proposal review",
    withOrganizationId: "worg_beacon",
    participant: "Stephanie Reed",
    unread: false,
    messages: [
      { id: "wm6", from: "Stephanie Reed", body: "The board would like to review the findings before we finalize next steps.", at: "1 week ago" },
      { id: "wm7", from: "Alicia Ford", body: "Sending the full proposal over now — happy to answer questions.", at: "6 days ago" },
    ],
  },
  {
    id: "wthread_4",
    subject: "Summit Outdoor Gear — introduction",
    withOrganizationId: "worg_summit",
    participant: "Kevin Yoon",
    unread: false,
    messages: [
      { id: "wm8", from: "Kevin Yoon", body: "Thanks for the call yesterday — sending over our market research goals as promised.", at: "Yesterday" },
      { id: "wm9", from: "Alicia Ford", body: "Got them, reviewing now — will have a proposal back to you by Friday.", at: "Yesterday" },
    ],
  },
];

export const WORKSPACE_CALL_NOTES: CallNote[] = [
  { id: "wcall_1", contactName: "Natalie Cho", organizationId: "worg_northstar", authorId: "wemp_jordan", summary: "Discussed kickoff logistics and stakeholder list. Natalie will send the brand guidelines by Monday.", at: "2 days ago" },
  { id: "wcall_2", contactName: "Omar Hassan", organizationId: "worg_atlas", authorId: "wemp_jordan", summary: "Explained the mockup delay. Omar was understanding, asked for a written timeline update.", at: "2 days ago" },
  { id: "wcall_3", contactName: "Kevin Yoon", organizationId: "worg_summit", authorId: "wemp_alicia", summary: "Intro call — market research scope, budget range $20-25K, timeline flexible. Strong fit for Q4.", at: "Yesterday" },
  { id: "wcall_4", contactName: "Stephanie Reed", organizationId: "worg_beacon", authorId: "wemp_alicia", summary: "Walked through ops review findings. Stephanie wants the formal proposal by end of week.", at: "Today" },
];

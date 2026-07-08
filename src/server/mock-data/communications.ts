import type { CallNote, ChatChannel, ChatMessage, EmailThread } from "@/types";

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

export const DEMO_CHAT_CHANNELS: ChatChannel[] = [
  { id: "chan_general", name: "general", isClientChannel: false },
  { id: "chan_sales", name: "sales", isClientChannel: false },
  { id: "chan_field", name: "field-ops", isClientChannel: false },
  { id: "chan_riverside", name: "Riverside Properties", isClientChannel: true },
];

export const DEMO_CHAT_MESSAGES: ChatMessage[] = [
  { id: "cm1", channelId: "chan_general", author: "Sam Okafor", authorInitials: "SO", body: "Reminder: safety check-in process changes go live Monday.", at: "9:02 AM" },
  { id: "cm2", channelId: "chan_general", author: "Jane Dorsey", authorInitials: "JD", body: "Riverside client confirmed the walkthrough for Tuesday.", at: "9:14 AM" },
  { id: "cm3", channelId: "chan_general", author: "Morgan Lee", authorInitials: "ML", body: "Q2 revenue numbers are posted in Finance — nice work everyone.", at: "10:30 AM" },
  { id: "cm4", channelId: "chan_sales", author: "Priya Shah", authorInitials: "PS", body: "Bayview Construction Partners looks promising — sending over a rough estimate Friday.", at: "8:45 AM" },
  { id: "cm5", channelId: "chan_sales", author: "Jane Dorsey", authorInitials: "JD", body: "Nice. Northgate Holdings proposal is due next week too.", at: "9:05 AM" },
  { id: "cm6", channelId: "chan_field", author: "Marcus Webb", authorInitials: "MW", body: "Sending the updated estimate for Smith Co. today.", at: "7:50 AM" },
  { id: "cm7", channelId: "chan_field", author: "Diego Ramirez", authorInitials: "DR", body: "Fitting room partitions are in for Fifth Ave — starting install tomorrow.", at: "8:20 AM" },
  { id: "cm8", channelId: "chan_field", author: "Casey Nguyen", authorInitials: "CN", body: "Rooftop framing at Downtown Lofts starts Thursday, weather permitting.", at: "11:00 AM" },
  { id: "cm9", channelId: "chan_riverside", author: "Sarah Chen", authorInitials: "SC", body: "Really happy with progress so far — the kitchen looks great!", at: "Yesterday" },
  { id: "cm10", channelId: "chan_riverside", author: "Jane Dorsey", authorInitials: "JD", body: "Thank you! We're on track for the final inspection in a couple weeks.", at: "Yesterday" },
];

export const DEMO_CALL_NOTES: CallNote[] = [
  { id: "call_1", contactName: "Sarah Chen", organizationId: "org_riverside", authorId: "emp_jane", summary: "Discussed kickoff logistics and crew access to the clubhouse. Sarah will provide gate codes by Monday.", at: "2 days ago" },
  { id: "call_2", contactName: "Robert Kim", organizationId: "org_smith", authorId: "emp_jane", summary: "Explained signage vendor delay. Robert was understanding, asked for a written timeline update.", at: "2 days ago" },
  { id: "call_3", contactName: "Ben Carter", organizationId: "org_bayview", authorId: "emp_priya", summary: "Intro call — warehouse retrofit scope, budget range $80-90K, timeline flexible. Strong fit for Q4.", at: "Yesterday" },
  { id: "call_4", contactName: "Nora Islam", organizationId: "org_northgate", authorId: "emp_priya", summary: "Walked through office renovation requirements. Nora wants a proposal with two design options.", at: "Today" },
  { id: "call_5", contactName: "David Park", organizationId: "org_harbor", authorId: "emp_priya", summary: "Confirmed steel delivery timeline, no concerns raised. Quick, positive call.", at: "3 days ago" },
  { id: "call_6", contactName: "Rachel Whitfield", organizationId: "org_whitfield", authorId: "emp_priya", summary: "Discussed final design tweaks ahead of contract signing — requested one more walkthrough.", at: "Today" },
];

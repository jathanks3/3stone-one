# The First-Run Experience — Designing the "Wow" Moment

**New in this revision.** The founder's request was specific: someone
logging into the demo for the first time should immediately think "I want
this for my business." That's a reaction, not a feature, and it doesn't
happen by accident — it has to be designed as one continuous moment, not
assembled from whichever screens happen to load first. This document is
that design.

## Why this gets its own document instead of a line in the wireframes

Every other document in this set describes a piece of the system. This one
describes an *experience that spans several of those pieces in a specific
order*, timed deliberately — the Dashboard, the AI briefing, the Industry
Profile switcher, and Global Search all already exist elsewhere in this
document set; what's new here is the sequence and the pacing that turns
four separate features into one moment.

## The rule underneath all of it: the demo must never show an empty state

Nothing kills a "wow" moment faster than a fresh account with nothing in
it. Every principle below depends on this one: the demo workspace
(`/demo`) is never a blank slate — it's a fully lived-in company with
history, in-flight work, overdue items, a recent win, and enough content
that every feature being shown off has something real to show. This is a
seed-data requirement as much as a design one, and it's called out in
[11-roadmap.md Phase 1](11-roadmap.md#phase-1--shell-auth-sites-dashboard-v1)
for exactly this reason.

## The first 90 seconds, scripted

**0:00 — Landing on `/demo`.** A branded loading moment, not a spinner —
a purposeful reveal (the 3Stone One logo settling into place, sub-second)
that respects `prefers-reduced-motion` and is fast specifically because a
slow "wow" moment isn't one; see the performance targets in
[01-architecture.md §12](01-architecture.md#12-performance--feel).

**0:02 — The Dashboard appears, already fully populated.** Server-rendered
(no client-side loading flash), answering the six questions from
[10-ui-wireframes.md](10-ui-wireframes.md) immediately: overdue jobs,
unpaid invoices, revenue trending up, a specific person behind on specific
work.

**0:04 — The morning briefing is already there, already specific.** Not
"Welcome! Here's your dashboard" — the actual generated-feeling briefing:
*"Revenue is up 12% this week, driven by the Riverside contract closing.
Two jobs are overdue — Smith Co. and the downtown remodel — and Jane
hasn't logged time on either in 3 days."* The specificity is the point:
real names, real numbers, real overdue items, pulled from the seeded demo
data, not generic filler. This is the single highest-leverage sentence in
the entire product, because it's the first thing that makes someone think
"this isn't a demo, this is *my* business" — even though it's Acme
Construction's data, not theirs, yet.

**0:15 — A subtle, specific invitation to the industry switcher.** Not a
guided-tour overlay covering the screen — a small, dismissible callout
near Settings: *"See this instantly adapt to your industry →."* This is
deliberately restrained: one nudge, not a forced walkthrough, because a
forced tour undercuts "wow" by making the product feel like it needs
explaining.

**0:20 — The industry relabel, live.** The user clicks Restaurant,
Construction, or Law Firm in the Industry Profile switcher
([10-ui-wireframes.md](10-ui-wireframes.md), and demonstrated live in the
[executive architecture briefing artifact](00-overview.md)) and watches
the entire nav, board columns, and terminology change in place, with no
page reload and no data loss. This is the single most concrete proof of
the product's central architectural bet
([01-architecture.md §4](01-architecture.md#4-industry-adaptability)), and
it is designed to be *seen happening*, not just described — the same
reason the interactive demo was built into the architecture briefing
artifact rather than only written about.

**0:35 — Global Search, tried once, satisfying immediately.** The demo
data is deliberately seeded richly enough that typing two or three
characters into ⌘K returns real, cross-module results on the first try —
a customer, a project, an invoice, and an AI Knowledge entry all showing up
for the same query is what makes "one search bar for everything" land as
true rather than as a claim.

**0:50 — One AI action, anywhere, produces a real answer.** Clicking any
`<AiActionButton/>` — "Summarize history" on a lead, "Estimate completion"
on a project — returns an answer built from that specific record's real
(seeded) fields within about a second, not a spinner followed by generic
text. This is where "AI everywhere" stops being a marketing claim and
becomes something the visitor just personally experienced, twice, on two
different screens, in under a minute.

## What this experience is not

- **Not a forced product tour.** Tours are an admission that the product
  doesn't explain itself; this experience is designed so the product
  explains itself by being used, with at most one small nudge (the 0:15
  callout above).
- **Not dependent on the visitor doing anything specific.** Everything
  through 0:20 happens whether or not the visitor takes the suggested
  action — the dashboard, the briefing, and the populated state are the
  baseline experience, not a reward for following a script.
- **Not slower than the rest of the product to make room for polish.**
  Every beat above is bound by the same performance targets as every other
  screen — see [01-architecture.md §12](01-architecture.md#12-performance--feel).
  A "wow" moment that loads slowly reads as a demo; one that's instant
  reads as software that's actually built.

## How this gets built, and when

This is [Phase 11](11-roadmap.md#phase-11--polish--first-run-wow-pass) —
deliberately late, not because the experience doesn't matter early, but
because every piece it choreographs (Dashboard, AI briefing, Industry
Profile switcher, Global Search) has to already exist and already be real
before the sequencing and pacing between them can be tuned. Phase 1
through Phase 10 build the parts; Phase 11 is where they're deliberately
assembled into the specific 90 seconds described above, timed and tested
the way a product launch demo would be rehearsed — because that's
effectively what `/demo` is.

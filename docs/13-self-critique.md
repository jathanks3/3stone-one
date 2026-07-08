# Self-Critique — Where This Design Is Weakest

**Revision note (v2):** items 1–6 are unchanged from v1 — nothing about
adding Finance, Communications, Meetings, Knowledge Center, or the
expanded Client Portal made those risks go away, and none of their
mitigations needed to change. Items 7–11 are new, added because this
revision genuinely raised the risk profile of the project, and pretending
otherwise would defeat the point of this document.

## 1–6: unchanged from v1 (industry adaptability depth, RBAC ceiling, mock-to-real backend swap, automation builder scope, nine-industries distraction, team-size-vs-surface-area) — see below for the full original text.

### 1. Terminology relabeling alone probably isn't enough industry adaptability

Pipeline/stage lists are data per Industry Profile, not a hardcoded enum.
Residual risk: custom fields and stages cover structure, not behavior — the
first two real industry profiles (Phase 11) are the actual test of this.

### 2. RBAC will hit a ceiling in enterprise sales conversations before the roadmap gets there

Department/own/shared scoping is solid in v1; custom roles are deferred on
purpose, with an honest "that's on our roadmap" as the accepted interim
answer.

### 3. The mock-to-real backend swap is riskier than the diagrams make it look

The database schema was designed as the target real schema first. Residual
risk: optimistic-update/concurrency behavior can't be fully validated
against mock data no matter how careful the mock is.

### 4. The workflow automation builder is the single most technically ambitious original module

V1 ships a fixed catalog of known trigger/action node types, not a general
scripting platform.

### 5. Nine industries at launch is a distraction, not a strength

Only three are fully built for the portfolio; the rest ship honestly
labeled "coming soon."

### 6. This is a lot of surface area for the team size actually building it

Mitigated by the phased, independently-demoable roadmap and by reusing
BetAI's validated patterns rather than inventing new ones.

---

## 7. This revision roughly doubled the product's surface area — that is itself the biggest risk

**The risk:** Finance, Communications, Meetings, Knowledge Center, an
expanded Client Portal with real payments, multi-location, multi-business,
white-label, and a marketplace extension point is, in aggregate, enough
scope for a much larger team than the one building this. Calling it "the
operating system for a business" and then trying to fully build the
operating-system version of every module at once is the single most likely
way this project stalls.

**Mitigation already in the design:** the roadmap grew from 10 phases to
15 specifically so each addition is its own gated phase rather than
everything shipping at once — but a longer roadmap is a mitigation for
*sequencing* risk, not for *total effort* risk. **What's still a real risk
we're accepting on purpose:** if Phase 3 (CRM) is taking noticeably longer
than Phase 1–2 took, that is the signal to cut scope within a module (fewer
AI capabilities, simpler Report Builder filters) rather than to compress
the roadmap by skipping phases — the ordering is what keeps the app
demoable at every step, and that's worth protecting even under schedule
pressure.

## 8. "AI everywhere" is one capability registry away from being eleven half-built AI features

**The risk:** the whole point of the `AiCapability` pattern
([01-architecture.md §5](01-architecture.md#5-ai-everywhere-one-capability-many-modules))
is to avoid this, but the pattern only holds if every capability's mocked
`run()` is actually built from the specific record it's summarizing —
"Summarize customer history" that returns generic boilerplate regardless
of which customer is selected will look, in a demo, exactly like the thing
this whole architecture was designed to prevent.

**Mitigation:** this is called out explicitly in
[01-architecture.md §5](01-architecture.md#5-ai-everywhere-one-capability-many-modules)
as a requirement, not a nice-to-have — each capability's mock must read the
actual mock record's fields. **Residual risk:** once a real model is wired
in (post-Phase 14), prompt quality, hallucination, and latency become real
product-quality risks in a way a hand-written mock never surfaces — this
document set intentionally doesn't pretend to have solved that yet, since
it's not a Phase-0-14 problem, it's a "the moment a real LLM call is in the
loop" problem.

## 9. Global Search is a single point of failure for a *lot* of trust

**The risk:** the pitch for one search bar is "type once, find anything."
The failure mode is just as unified — if `SearchIndexEntry` ever falls out
of sync with real data (a service that updates a record but forgets to
call `searchIndexService.upsert`), the product doesn't just have a search
bug, it has a "the AI told me something that isn't true anymore" bug,
because `AiActionLog` entries are also searchable.

**Mitigation:** the architecture calls for the index write to happen in
the *same* service function as the record write, not a separate sync
job — this is a real constraint, not a suggestion, and worth enforcing
with a shared base-service helper (flagged in
[02-folder-structure.md](02-folder-structure.md)) as soon as more than a
couple of services exist, rather than trusting every future service author
to remember.

## 10. Client Portal payments raise the compliance/trust bar for the whole product

**The risk:** the moment a client can pay a real invoice, this product is
handling real money on behalf of a real business — that's a different
trust bar than a CRM or a Kanban board. A bug in the Client Portal payment
flow is a support fire in a way a bug in the Report Builder never is.

**Mitigation:** Stripe Elements/Payment Intents means 3Stone One never
touches raw card data, keeping PCI scope with Stripe — stated explicitly
in [08-integration-strategy.md](08-integration-strategy.md). **Residual
risk we're accepting on purpose:** this is exactly why Stripe was promoted
to a *real* integration (test-mode) as early as Phase 8, rather than
mocked all the way through Phase 14 like everything else — a fake-feeling
payment flow would undersell the feature, but a payment flow is also the
last place in this app where "it looked right in the demo" should be the
bar for "it's done."

## 11. Finance is the module most likely to be asked to become an accounting system

**The risk:** once Revenue, Profit, Invoices, and Expenses exist on
screen, it is a very natural next customer ask to want reconciliation,
multi-currency, tax handling, or a general ledger — i.e., to slowly become
QuickBooks, which the product brief explicitly says not to do.

**Mitigation:** [01-architecture.md §8](01-architecture.md#8-finance-decision-support-not-a-ledger)
draws this line in writing, before a single Finance screen exists, so the
answer to that ask is already "sync it from QuickBooks, don't rebuild it
here" rather than a decision made under sales pressure later.

## What would make us revisit this document set (unchanged criteria, two additions)

Everything from v1 (a component hardcoding an industry name, a permission
check that can't be expressed as module/action/scope, a mock data shape
that wouldn't map to the real schema) still applies. Add to that list:

- An AI capability's mocked output has to be hand-tuned per demo scenario
  to look convincing (signals item 8 above is already happening)
- A second service is found to have skipped the search-index write
  (signals item 9 above needs the shared helper sooner, not later)

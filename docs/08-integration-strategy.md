# Integration Strategy

**Revision note (v2):** the `IntegrationProvider` interface and mock-first
approach are unchanged. This revision adds three integrations that
weren't optional before but are now load-bearing for specific new
modules — Stripe (Client Portal payments), QuickBooks (Finance), and
Email/Calendar (Communications, Meetings) — and promotes Stripe to the
first *real* integration in the roadmap.

## The core idea (unchanged)

3Stone One is a hub, not a replacement. Every provider implements one
common interface: `connect()`, `disconnect()`, `sync()`, `getStatus()`.

## Integrations with new, specific product dependencies

| Provider | Was | Now also powers |
|---|---|---|
| **Stripe** | Generic "Payments" category integration | The Client Portal's "Pay Now" button (real Payment Intents, [Phase 13](11-roadmap.md)) and Finance's Invoice `paid` status — this is why Stripe, not QuickBooks, is the first integration promoted to real, ahead of everything else in [11-roadmap.md](11-roadmap.md) |
| **QuickBooks** | Generic "Accounting" category integration | Finance's Revenue Overview, Profit Dashboard, and Outstanding Invoices read-only sync — see the explicit scope boundary in [01-architecture.md §8](01-architecture.md#8-finance-decision-support-not-a-ledger): 3Stone One never writes accounting entries back to QuickBooks, only reads |
| **Email (Gmail/Microsoft 365 via IMAP or provider API)** | Listed as "Email" under Communication | Populates `EmailMessage` records in the Communications Center — mocked as realistic seeded threads until real OAuth is wired up |
| **Calendar (Google Calendar / Microsoft 365)** | Not previously listed | Meetings' `calendarEventId` sync — a Meeting created in 3Stone One shows up on the organizer's real calendar, and vice versa, once real |

Every other provider from the original brief (Excel, Google Sheets, Toast
POS, Calendly, Slack, Shopify, HubSpot, Salesforce, Microsoft 365, Google
Workspace) is unchanged — same mock-adapter approach, same category
grouping on the Integrations page.

## Client Portal payments, specifically

```
Client clicks "Pay Now" on an Invoice
  → POST /api/v1/client-portal/invoices/:id/pay
  → stripeProvider.createPaymentIntent(invoice.amount)
  → client completes payment via Stripe Elements (embedded, PCI scope
    stays with Stripe — 3Stone One never touches raw card data)
  → webhook confirms payment → Invoice.status = "paid", Payment row created
```

In mock phases, this entire flow runs against a **Stripe test-mode**
integration (not a fully fake adapter like other providers) as early as
[Phase 8](11-roadmap.md#phase-8--client-portal-expanded--report-builder) —
because "the client can pay an invoice" is a core enough promise that
demoing it against a believable-but-fake payment would undersell the
feature; Stripe's test mode gives a genuinely real payment flow with fake
money, which is a better demo *and* de-risks the real integration later.

## What we are still not doing in v1 (unchanged)

Not building a generic "connect anything via API key" system; not handling
every provider's edge cases before a real customer needs that specific
provider live.

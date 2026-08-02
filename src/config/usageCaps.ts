// Plain constants only, no server imports - safe for both client
// components (Settings' usage display) and server code (usageCapService,
// stripeService) to import directly. Real AI is included for every
// workspace on every edition; these numbers are what keeps that safe -
// see the founder's pricing review for the margin math behind them.
// Never raise them without re-running that math.
export const AI_ACTIONS_INCLUDED_PER_CYCLE = 400;
// Real revenue gap found and closed here: every new signup starts as
// Subscription.status "trialing" with no Stripe subscription and no card
// ever collected at signup (checkout only happens later, in Settings ->
// Billing) - the AI cap above was being handed out in full to that
// state, meaning anyone could sign up for free and use 400 real,
// billable Claude actions a month forever, never paying anything. A
// trialing (or past_due/canceled/paused) workspace gets this much
// smaller, one-time total instead - enough to see the real assistant is
// worth paying for, not enough to matter as a cost. Full per-cycle
// access requires status "active" (a real, paid Stripe subscription).
export const TRIAL_AI_ACTIONS_TOTAL = 20;
export const STORAGE_GB_INCLUDED = 10;
export const AI_OVERAGE_PACK_ACTIONS = 100;
export const AI_OVERAGE_PACK_PRICE_CENTS = 500; // $5 per 100 extra actions
export const STORAGE_OVERAGE_PACK_GB = 5;
export const STORAGE_OVERAGE_PACK_PRICE_CENTS = 500; // $5 per +5GB, permanent

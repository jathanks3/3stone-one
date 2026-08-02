// Plain constants only, no server imports - safe for both client
// components (Settings' usage display) and server code (usageCapService,
// stripeService) to import directly. Real AI is included for every
// workspace on every edition; these numbers are what keeps that safe -
// see the founder's pricing review for the margin math behind them.
// Never raise them without re-running that math.
export const AI_ACTIONS_INCLUDED_PER_CYCLE = 400;
export const STORAGE_GB_INCLUDED = 10;
export const AI_OVERAGE_PACK_ACTIONS = 100;
export const AI_OVERAGE_PACK_PRICE_CENTS = 500; // $5 per 100 extra actions
export const STORAGE_OVERAGE_PACK_GB = 5;
export const STORAGE_OVERAGE_PACK_PRICE_CENTS = 500; // $5 per +5GB, permanent

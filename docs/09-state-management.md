# State Management Strategy

**Revision note (v2):** the four-category split (server state / server-
rendered first paint / client UI state / session context) is unchanged.
This revision adds two things the new modules need that v1 didn't: a
polling-based real-time layer (Internal Chat, live notification badges,
meeting reminders) and search-specific state (the ⌘K palette's query and
result state).

## 1–4: unchanged from v1

Server state via TanStack Query, first paint via Next.js Server Components,
client-only UI state via small per-feature Zustand stores, session/active
workspace via React Context. See the original reasoning — none of it
stopped applying; Finance, Communications, Meetings, and Knowledge Center
data all flow through the same TanStack Query pattern as CRM and Projects
always did.

## 5. Real-time-feeling state — polling now, push later

Internal Chat and live notification badges are the first features in this
product where "the data might have changed a few seconds ago because
someone else did something" is a real, constant condition — not an edge
case. Rather than building real push infrastructure before there's a
second real user to push to:

- `ChatChannel` messages and the notification bell poll via TanStack
  Query's `refetchInterval` (short — a few seconds) while their view is
  open, and stop polling when it isn't.
- This is genuinely indistinguishable from real-time in a demo, and in
  early real usage with small teams — the swap to a websocket provider
  (Pusher or Supabase Realtime, per [01-architecture.md](01-architecture.md))
  in [Phase 12](11-roadmap.md) changes the *transport* underneath the same
  TanStack Query cache, not the component code reading it.

## 6. Search state

The ⌘K palette (`<SearchPalette/>`) owns its own small Zustand store
(`useSearchStore`: open/closed, current query, selected result index) —
UI-only state, not server state, even though it triggers a debounced
TanStack Query call to `/api/v1/search` for the actual results. This keeps
"is the palette open" (instant, local) separate from "what did the server
find" (async, cached, same rules as every other server-state query in the
app).

## Where each kind of state is still not allowed to leak (unchanged, reaffirmed)

Server state never gets copied into a Zustand store for convenience.
UI-only state never round-trips through the API. The new polling-based
"real-time" data is still server state, fetched through TanStack Query —
it does not get its own separate state system just because it refreshes
faster than everything else.

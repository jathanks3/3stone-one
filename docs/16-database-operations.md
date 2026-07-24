# Database Operations — Neon + Prisma

The real Postgres database backing this app, provisioned via Vercel's Neon
marketplace integration. This document is the operational reference:
setup, how migrations get applied, rollback, backup, and credential
rotation. See [03-database-schema.md](03-database-schema.md) for the
schema itself and [15-company-platform-vision.md](15-company-platform-vision.md)
for why the schema is shaped the way it is.

## Why Neon

Chosen over Supabase specifically because this app's own architecture
already plans its own auth/service layers — Supabase's value is largely
its bundled Auth/Storage/Realtime, which would tempt mixing two
architectural approaches. Neon is Postgres, cleanly, with branching,
autoscaling, and scale-to-zero, integrated directly into Vercel. Neon's
own bundled "Neon Auth" add-on is explicitly **disabled**
(`auth=false` at provision time) for the same reason.

## Setup

Provisioned via `vercel integration add neon`, **not** the Neon dashboard
directly — this keeps billing, environment variables, and project linkage
entirely inside Vercel's marketplace flow, so there's one place (the
Vercel project settings) that reflects the true state of the integration.

- **Plan:** `free_v3` (Neon Free) — 0.5 GB storage, no credit card. **Do
  not change the plan without stopping to ask first** — this is a hard
  constraint from the founder, not a suggestion.
- **Region:** `iad1` (Vercel's US-East, closest to Georgia).
- **Resource name:** `3stone-one-production`.
- **Connected environments:** Development, Preview, Production — all
  three, so preview deployments and local dev hit the same schema shape
  (not the same data — see "Environments" below).

### Environment variables this creates

Two connection strings, both secret, never committed:

- `DATABASE_URL` — **pooled** (pgbouncer, hostname contains `-pooler`)
  connection. Used by the running app (`src/server/db.ts`) at runtime, in
  every environment.
- `DATABASE_URL_UNPOOLED` — **unpooled** connection (this is Vercel's Neon
  integration's actual variable name — not `DIRECT_URL`, which is the more
  common Prisma convention elsewhere; `prisma.config.ts` checks
  `DIRECT_URL` first, then falls back to this, so either works). Used
  only by the Prisma CLI (`migrate deploy`, `migrate dev`, `db pull`,
  `studio`) — migrations need session-level features a pooled connection
  doesn't reliably support.
- Neon's integration also sets several other variable names
  (`PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`, `POSTGRES_*`,
  `NEON_PROJECT_ID`) for compatibility with other tools' conventions —
  this app only reads the two above.

Prisma 7 moved connection configuration out of `schema.prisma` entirely;
`prisma.config.ts` is read only by the CLI, never by the deployed app's
runtime client, which is why the pooled/direct split lives across two
different files rather than one `datasource` block. See
`prisma.config.ts`'s own comments for the exact mechanism.

`.env.example` documents every variable name (no real values, ever). Copy
it to `.env.local` for local development, pointed at your own values —
either a Neon branch (see "Environments" below) or a local Postgres.

## Environments

Neon's branching model maps naturally onto Vercel's three environments,
but **out of the box the integration connects the same database to all
three** — that's a starting point, not the final state. Before real
customer data exists, create a Neon branch per non-production environment
(`vercel integration open neon 3stone-one-production` reaches the Neon
console via SSO) so Preview deployments and local development never read
or write production rows. This is called out explicitly rather than left
implicit because forgetting it is exactly the kind of mistake that looks
fine until the first real customer signs up.

## Applying migrations

**Always `prisma migrate deploy`, never `db push`, against anything but a
disposable local database.** `db push` has no migration history, can't be
rolled back in the normal sense, and silently accepts destructive schema
changes without a review artifact. Every schema change in this project
goes through a checked-in migration file under `prisma/migrations/`.

```bash
# 1. Confirm the target is what you think it is — see "Before every migration" below
# 2. Apply every pending migration in order
npx prisma migrate deploy

# 3. Seed reference data (idempotent — safe to re-run)
FOUNDER_EMAIL=you@3stoneai.com npx prisma db seed
```

### Before every migration, verify

1. **Which database you're pointed at.** `echo $DATABASE_URL` /
   `echo $DATABASE_URL_UNPOOLED` and confirm the hostname matches
   `3stone-one-production` (or the intended branch) — not a guess, not
   "probably." A pooled/direct URL pointed at the wrong branch is how a
   migration ends up applied to the wrong environment.
2. **That the target is empty, for the very first migration only.**
   `npx prisma migrate status` reports pending vs. applied migrations. On
   a truly fresh Neon branch, every migration should show as pending, and
   there should be no pre-existing application tables — the Neon console
   or `psql \dt` confirms this if there's any doubt before `migrate
   deploy` runs for the first time.
3. **That the migration file matches what's committed.** `git status
   prisma/migrations/` should be clean — never hand-edit a migration file
   that's already been applied anywhere.

## Rollback

Prisma's migration history is forward-only by design — there is no
`prisma migrate down`. Two real options, in order of preference:

1. **Write a new, forward migration that undoes the change.** This is the
   only option that keeps the migration history (and therefore
   `prisma migrate status` and every future developer's understanding of
   schema evolution) accurate. For an additive mistake (wrong column
   type, unwanted table), write the corrective migration the same way any
   other schema change is made — edit `schema.prisma`, `prisma migrate
   dev` locally to generate the new migration file, review it, commit it,
   `prisma migrate deploy` to production.
2. **Point-in-time restore via Neon branching**, for a destructive
   mistake that already ran against real data (not just schema — actual
   row loss). Neon branches from any point in the retention window
   (Free plan: recent history, not indefinite) without needing a separate
   backup restore process — branch from just before the bad migration,
   verify the branch looks right, then promote it or copy the needed data
   back. This is a "stop and think" operation, not a scripted one-liner —
   there is no automatic rollback path that doesn't risk losing whatever
   happened *after* the mistake too.

## Backup

Neon's own point-in-time recovery (branching from any timestamp in the
retention window) is the primary backup mechanism on the Free plan — there
is no separate "download a dump" step required for basic recoverability.
Two things worth doing once real customer data exists, not yet required
while the schema is still just seeded reference data:

- A scheduled `pg_dump` to object storage, independent of Neon, for the
  scenario where Neon itself is unavailable (belt-and-suspenders, not
  because Neon's own recovery is expected to fail).
- Documenting the actual retention window for the plan in effect at the
  time — this changes if the plan ever changes, which is exactly why plan
  changes require stopping to ask first (see Setup above).

## Credential rotation

1. In the Neon console (`vercel integration open neon
   3stone-one-production`), reset the password for the production role.
2. Vercel's Neon integration updates `DATABASE_URL`/`DATABASE_URL_UNPOOLED`
   automatically for connected environments when the integration itself
   manages the credential — confirm via `vercel env ls` that the values
   changed (names only are ever visible via CLI output; treat any command
   that would print the actual value as something to run locally, never
   pasted into a shared log).
3. Redeploy (or wait for the next deploy) so running instances pick up the
   new pooled connection — Vercel serverless functions read environment
   variables at cold start, so an old warm instance may keep the previous
   credential briefly; this is expected and not a rotation failure.
4. If rotation was triggered by a suspected leak (credential committed,
   logged, or shared somewhere it shouldn't have been), treat step 1 as
   urgent, not routine — rotate first, investigate the leak's scope
   second.

## Health check

`GET /api/health/db` (added alongside this document) confirms connectivity
without revealing any credential or infrastructure detail — see that
route's own comment for exactly what it does and does not expose.

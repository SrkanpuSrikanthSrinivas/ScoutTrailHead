# Architecture

## Shape
```
            ┌─────────────────────────┐
            │        Neon (Postgres)  │
            └───────────▲─────────────┘
                        │ Drizzle ORM (@neondatabase/serverless)
            ┌───────────┴─────────────┐
            │  Next.js API routes      │  apps/web/app/api/*
            │  (Vercel serverless)     │
            └───────▲─────────▲────────┘
       cookie JWT   │         │   Bearer JWT
            ┌───────┴───┐ ┌───┴──────────┐
            │  Web UI    │ │  Expo app    │
            │ (Next.js)  │ │ iOS+Android  │
            └────────────┘ └──────────────┘
```

## Why this split
- **One API, two clients.** The Next.js route handlers are the single source of truth.
  The web UI calls them same-origin (auth via httpOnly cookie); the mobile app calls the
  deployed URL with an `Authorization: Bearer` token. Same endpoints, same data.
- **Neon serverless driver** is built for Vercel's serverless/edge functions — no connection
  pool to exhaust. Use the **pooled** connection string.
- **Shared `packages/core`** holds the domain rules (ranks, pipeline steps, validation
  schemas) so web and mobile never drift.

## Auth
Self-contained, stored entirely in Neon — no third-party auth service:
- Passwords hashed with bcrypt (`users.password_hash`).
- On login/signup/join the server issues a signed JWT (`jose`, HS256, 7-day expiry)
  carrying `{ userId, troopId, role }`.
- Web stores it in an httpOnly cookie; mobile stores it in `expo-secure-store`.
- `getAuth()` (apps/web/lib/auth.ts) reads either source, so one handler serves both clients.
- **Multi-tenant:** every query is scoped by `troopId` from the token. A user only ever
  sees their own troop's data.

> To upgrade later (SSO, magic links, MFA) you can drop in Clerk or Auth.js without touching
> the data model — just replace the token issuing/verification in `lib/auth.ts` and the
> mobile `lib/auth.tsx`.

## Data model (packages/db/src/schema.ts)
- `troops` — name + unique invite code
- `users` — belongs to a troop, role admin|member
- `scouts` — troop-scoped; stage pipeline|active, step index, type new|transfer, rank, joined
- `badges` — belong to a scout; `given` = physical badge handed over
- `inventory` — troop-scoped; total / out / min (restock threshold)
- `faqs` — troop-scoped, ordered

## API surface
```
POST /api/auth/signup | login | join | logout
GET  /api/me
GET  /api/dashboard
GET/POST           /api/scouts
PATCH/DELETE       /api/scouts/:id
POST               /api/scouts/:id/step        { dir: 1 | -1 }
POST               /api/scouts/:id/graduate    { rank, joined }
POST               /api/scouts/:id/badges      { name, earnedDate, given }
PATCH/DELETE       /api/badges/:id
GET/POST           /api/inventory
PATCH/DELETE       /api/inventory/:id          ({ out } adjusts checked-out count)
GET/POST           /api/faqs
PATCH/DELETE       /api/faqs/:id
```

## Workflow & roles (added)
The intake pipeline is a role-gated state machine — see `docs/WORKFLOW.md`. Key additions to
the data model:
- `users.role` now: `admin | web_setup | finance | leader`.
- `scouts.status` replaces the old stage/step: `submitted | web_setup | finance | active | declined`.
- new `scout_events` table = append-only audit trail of every transition.
- new endpoints: `POST /api/scouts/:id/transition`, `POST /api/public/intake?code=`,
  `GET /api/public/troop?code=`, `GET /api/users`, `PATCH /api/users/:id`.

> Because the schema changed, run `npm run db:generate && npm run db:migrate` again. On an
> existing database with old `stage/step` data you'd write a small data migration; on a fresh
> DB just generate + migrate + seed.

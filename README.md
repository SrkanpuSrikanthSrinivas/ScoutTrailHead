# Trailhead — Scout Workflow Management

One codebase, three surfaces:

- **Web app + API** — Next.js on Vercel
- **iOS & Android app** — Expo (React Native), built and submitted via EAS
- **Database** — Neon (serverless Postgres) via Drizzle ORM

The web and mobile apps talk to the **same API and the same Neon database**, so every
committee member sees the same live roster, pipeline, gear, and FAQ.

```
troop-trailhead/
├─ packages/
│  ├─ core/         shared constants, types, validation (ranks, steps, schemas)
│  └─ db/           Drizzle schema, Neon client, migrations, seed
├─ apps/
│  ├─ web/          Next.js — UI + /api routes (deploys to Vercel)   [npm workspace]
│  └─ mobile/       Expo Router app — iOS + Android (builds via EAS)  [standalone install]
└─ docs/            deployment runbooks
```

## What only you can do
I scaffolded everything below, but these steps need *your* accounts and credentials and
must be done by you:

1. Create a **Neon** project and copy the connection string.
2. Create a **Vercel** project and add env vars, then deploy.
3. Create an **Apple Developer account** ($99/yr) and a **Google Play Developer account** ($25 one-time).
4. Run the **EAS builds** and **submit to the stores** (Apple/Google review the app — that's on their side).

Full step-by-step for each is in `docs/`.

## Run it locally (15 minutes)

Prereqs: Node 20+, npm 9+, a free Neon database, and (for mobile) the Expo Go app or a simulator.

```bash
# 1. install everything
npm install

# 2. configure env — copy and fill in DATABASE_URL + AUTH_SECRET
cp .env.example .env
cp .env apps/web/.env            # web reads these at runtime
#   generate a secret:  openssl rand -base64 48

# 3. create the database tables, then seed a demo troop
npm run db:generate              # creates SQL migrations from the schema
npm run db:migrate               # applies them to Neon
npm run db:seed                  # demo troop + 3 role logins (all password123) + sample scouts

# 4. run the web app (http://localhost:3000)
npm run dev:web

# 5. run the mobile app (separate terminal)
#    mobile is NOT part of the root workspaces (keeps its React 18 away from the
#    web build), so install it on its own the first time:
cd apps/mobile && npm install && cd ../..
#    set apps/mobile/.env -> EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000
npm run dev:mobile
```

Sign in with one of the seeded logins (all `password123`):
- `admin@example.com` — admin (also manages the **Team** tab)
- `leader@example.com` — leader (receives parent submissions and starts the workflow)
- `web@example.com` — web setup (optional specialist)
- `finance@example.com` — finance (confirms payment, approves to roster)

Log in as each to see the **role-gated intake workflow**: web setup advances a scout to
finance, finance confirms payment and approves to the roster. The **Team** tab (admin) has
the shareable **parent intake link** — open it in a private window to submit a scout with no
account. See `docs/WORKFLOW.md` for the full flow.

## Deploy
- `docs/DEPLOY-NEON.md` — database
- `docs/DEPLOY-VERCEL.md` — web + API
- `docs/DEPLOY-MOBILE.md` — iOS + Android via EAS

## Naming your troop (configurable, not hard-coded)
The troop name is per-troop data, so the same deployment works for any troop:
- **At setup:** the **New troop** tab on the sign-in screen asks for your troop name.
- **Anytime after:** an admin can rename it under **Team → Troop name** (web) or via the
  **Rename** button on the mobile Home screen. The new name immediately drives the sidebar,
  the browser tab title, and the parent intake page.
- **Product label (optional):** the brand shown on the sign-in screen and browser title
  before login defaults to "Trailhead". To change it per deployment, set
  `NEXT_PUBLIC_APP_NAME` (web) / `EXPO_PUBLIC_APP_NAME` (mobile) in your env.

## Changing the rank ladder / steps
This is configured for **Scouts BSA** (Scout → Eagle). To switch to Cub Scouts or another
program, edit `packages/core/src/index.ts` — change `RANKS`, `STEPS_NEW`, and `STEPS_TRANSFER`.
Both the web and mobile apps pick up the change automatically because they share that package.

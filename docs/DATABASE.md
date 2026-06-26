# Setting up the database on Neon

You have three ways to create the tables. Pick one.

## Option A — paste SQL into the Neon console (no tooling)
1. In the Neon dashboard open your project → **SQL Editor**.
2. Open `packages/db/neon-setup.sql`, copy everything, paste, and **Run**.
   This creates all 7 tables, indexes, and foreign keys. Safe to re-run
   (`CREATE TABLE IF NOT EXISTS`).
3. (Optional) For a demo troop you can log into immediately, also paste and run
   `packages/db/neon-seed.sql`, then read the invite code from the final `SELECT`.
   Demo logins (all password `password123`):
   - `admin@example.com` (admin) · `web@example.com` (web setup) · `finance@example.com` (finance)

## Option B — psql / Neon CLI
```bash
psql "$DATABASE_URL" -f packages/db/neon-setup.sql      # schema
psql "$DATABASE_URL" -f packages/db/neon-seed.sql       # optional demo data
```
Use the **pooled** connection string from Neon as DATABASE_URL.

## Option C — Drizzle migrations (the app's normal flow)
```bash
npm run db:generate   # regenerate packages/db/drizzle/*.sql from the schema
npm run db:migrate    # apply to Neon
npm run db:seed       # optional demo data (same content as neon-seed.sql)
```
Use this once you start changing the schema — each `db:generate` writes a new timestamped
migration; `neon-setup.sql` is just the current snapshot.

## Notes
- `gen_random_uuid()` is built into Neon (Postgres 13+); no extension needed.
- The SQL files are generated from the same source as the app (`packages/db/src/schema.ts`),
  so they never drift.
- **Sign-in tracking** added a `sessions` table. Since `neon-setup.sql` uses
  `CREATE TABLE IF NOT EXISTS`, just **re-run it** on your existing database — it creates the
  new `sessions` table and leaves the rest untouched. No data is lost.
- If you ran an older version, the schema changed (workflow `status`, `scout_events`, roles, `sessions`).
  On a throwaway DB just re-run `neon-setup.sql`; on a DB with real data, write an
  `ALTER TABLE` migration instead.

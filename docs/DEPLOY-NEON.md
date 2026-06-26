# Deploy the database (Neon)

1. Create a free account at https://neon.tech and click **New Project**.
2. Pick a region close to your Vercel region (e.g. AWS us-east-2).
3. After it's created, open **Connection Details** and copy the **Pooled** connection string.
   It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Use the *pooled* one (host contains `-pooler`) — it's the right choice for Vercel's
   serverless functions.

4. Put it in your local `.env` as `DATABASE_URL`, then create the tables:
   ```bash
   npm run db:generate     # turn the schema into SQL migration files (packages/db/drizzle/)
   npm run db:migrate      # apply to Neon
   npm run db:seed         # optional: TROOP 216 + admin login + starter gear/FAQ
   ```

5. (Optional) Use Neon **branches** for a staging database — branch `main`, point your
   Vercel Preview deployments' `DATABASE_URL` at the branch, keep production on `main`.

### Notes
- Migrations live in `packages/db/drizzle/`. Commit them. On future schema changes, run
  `db:generate` then `db:migrate` again.
- The seed prints the troop's **invite code** — share it so committee members can self-register.

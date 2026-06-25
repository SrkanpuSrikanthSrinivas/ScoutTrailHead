# Deploy the web app + API (Vercel)

The web app and all `/api` routes deploy together as one Vercel project.

## One-time setup
1. Push this repo to GitHub/GitLab.
2. At https://vercel.com click **Add New → Project** and import the repo.
3. **Root Directory:** set to `apps/web`. Vercel reads `apps/web/vercel.json`.
4. **Environment Variables** (Production + Preview):
   ```
   DATABASE_URL = <your Neon pooled connection string>
   AUTH_SECRET  = <output of: openssl rand -base64 48>
   ```
5. Click **Deploy**.

## Why the install command is scoped (important)
`apps/web/vercel.json` installs **only** the web app and the two shared packages:

```
npm install --include-workspace-root \
  --workspace @trailhead/web --workspace @trailhead/core --workspace @trailhead/db
```

This is deliberate. The **mobile** app pins React 18.3.1 (required by Expo SDK 52) while the
**web** app uses React 19 (required by Next 15). If Vercel installed the whole monorepo, both
Reacts would land in the build tree and Next's prerender of `/404` and `/_error` fails with
`Cannot read properties of null (reading 'useContext')`. Excluding the mobile workspace leaves
exactly one React (19) in the web build. `react` and `react-dom` are also pinned to the same
exact version so they can't drift.

## Commit a lockfile (clears the SWC warning)
Run this once locally and commit the result so Vercel has a deterministic, SWC-complete lockfile:
```bash
npm install            # generates package-lock.json and lets Next patch in @next/swc
git add package-lock.json && git commit -m "add lockfile"
```
(The lockfile may list the mobile React — that's fine; the scoped install above never
materialises it for the web build.)

## After first deploy
- Run migrations against the production DB if you haven't:
  ```bash
  DATABASE_URL="<prod url>" npm run db:migrate
  ```
- Open the URL, create your real troop from **New troop**, share the invite + intake links.

## Mobile points at this URL
Set `apps/mobile/.env` → `EXPO_PUBLIC_API_URL=https://your-app.vercel.app`, then rebuild the
app (the URL is baked in at build time).

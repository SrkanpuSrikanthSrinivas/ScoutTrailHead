# Deploy the web app + API (Vercel)

The web app and all `/api` routes deploy together as one Vercel project.

## One-time setup
1. Push this repo to GitHub/GitLab.
2. At https://vercel.com click **Add New → Project** and import the repo.
3. **Root Directory:** set to `apps/web`.
   Vercel reads `apps/web/vercel.json`, which builds from the monorepo root so the shared
   packages are included.
4. **Environment Variables** (Production + Preview):
   ```
   DATABASE_URL = <your Neon pooled connection string>
   AUTH_SECRET  = <output of: openssl rand -base64 48>
   ```
5. Click **Deploy**. You'll get a URL like `https://troop-trailhead.vercel.app`.

## After first deploy
- Run migrations against the production DB if you haven't:
  ```bash
  DATABASE_URL="<prod url>" npm run db:migrate
  ```
- Open the URL, create your real troop from **New troop**, and share the invite code.

## Connect a custom domain (optional)
Project → **Settings → Domains** → add e.g. `troop100.org`. Vercel handles HTTPS.

## Important for mobile
Whatever final URL you land on (Vercel domain or custom domain) is what the mobile app must
point at. Set it in `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://troop-trailhead.vercel.app
```
Rebuild the mobile app after changing this (it's baked in at build time).

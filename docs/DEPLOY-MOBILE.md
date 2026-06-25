# Build & ship the mobile app (iOS + Android) with EAS

Expo's EAS service builds the native binaries in the cloud and can submit them to the
stores. You run the commands; Apple and Google host and review the result.

## Heads up: mobile installs on its own
`apps/mobile` is intentionally **not** part of the root npm workspaces (its React 18 must stay
out of the web build). So install it standalone:
```bash
cd apps/mobile
npm install        # pulls Expo + React Native + links @trailhead/core via file:
```
The shared `@trailhead/core` package is wired in as `"file:../../packages/core"`, and
`metro.config.js` already watches the repo root so Metro can read that source.

## What you need first
- An **Expo account** (free): https://expo.dev
- **Apple Developer Program** membership — $99/year — https://developer.apple.com/programs
- **Google Play Developer account** — $25 one-time — https://play.google.com/console
- The web app already deployed (you need its URL).

## 0. Set the API URL and identifiers
- `apps/mobile/.env`:
  ```
  EXPO_PUBLIC_API_URL=https://your-app.vercel.app
  ```
- In `apps/mobile/app.json` change the bundle/package IDs from the placeholder
  `com.yourtroop.trailhead` to something you own, e.g. `org.troop100.trailhead`
  (must be unique across each store).

## 1. Install tooling and log in
```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build:configure      # links the project to your Expo account
```

## 2. Build
```bash
# A shareable Android APK to test on real devices right away:
eas build --profile preview --platform android

# Production builds for the stores:
eas build --profile production --platform android   # -> .aab for Play
eas build --profile production --platform ios       # -> signed .ipa for App Store
```
On the first iOS build, EAS will offer to **create the signing credentials for you**
(certificates + provisioning). Say yes and sign in with your Apple account when prompted —
EAS manages them from then on. (This is the code-signing step that has to be done under your
Apple identity; it can't be pre-baked.)

## 3. Submit to the stores
Fill in the placeholders in `apps/mobile/eas.json` under `submit.production` first
(`appleId`, `ascAppId`, `appleTeamId` for iOS; a Play service-account JSON for Android), then:
```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```
- **iOS:** the build lands in App Store Connect. Add screenshots, description, and privacy
  details, then submit for **App Review** (typically a day or two).
- **Android:** the build lands in Play Console. Complete the store listing and content
  rating, then roll out (Internal testing → Production).

## 4. Updates later
- JS-only changes (most feature tweaks): `eas update` pushes over-the-air, no re-review.
- Native changes (new permissions, SDK bumps): rebuild and resubmit.

## Monorepo note
`apps/mobile/metro.config.js` is already set up to resolve the shared `@trailhead/core`
package from the workspace root. If an EAS build ever can't resolve it, the fallback is to
copy the few constants from `packages/core/src/index.ts` directly into the mobile app — but
the metro config should handle it.

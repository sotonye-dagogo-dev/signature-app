# Lessons Learned

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Practical knowledge accumulated during development.

---

## Lessons

## GitHub App cannot push workflow files without `workflows` permission

**Apply when:** A GitHub App (e.g. OpenCode bot) is used to commit `.github/workflows/*.yml`.

**Lesson:** The push fails with `! [remote rejected] ... (refusing to allow a GitHub App to create or update workflow '.github/workflows/deploy.yml' without 'workflows' permission)`. The App's installation must be granted the `Workflows` repository permission, or workflow changes must be routed through a human/PR where the app has write access. This is a hard platform restriction, not a git/config error.

**Status:** Active

## Node.js v25 breaks the local Angular build/test pipeline

**Apply when:** Running `ng build` / `ng test` locally.

**Lesson:** The Angular CLI used here does not work reliably on Node v25. CI pins Node 20 (`actions/setup-node` with `node-version: 20`), and `npm ci` must be run with `--legacy-peer-deps` because of the peer-dependency graph (e.g. `vite-plugin-angular`). Use Node 20 for local builds to match CI.

**Status:** Active

## Signing key is committed in plaintext as a deliberate fallback

**Apply when:** Handling the `BACKEND_SIGNING_KEY` / `signingKey` value.

**Lesson:** The signing key (`signature-app-for-my-project-2025`) is intentionally committed in plaintext in `environment.ts` as a static fallback; `build-with-cleanup.cjs` and `dev-with-env.cjs` overwrite the file with a per-build encrypted key triple read from `.env`. Treat the committed value as a dev convenience, not a production secret — this is documented as obfuscation-level security only.

**Status:** Active

## Firebase CI deploy fails with auth error when `FIREBASE_TOKEN` secret is unset

**Apply when:** `deploy.yml`'s "Deploy to Firebase Hosting" step fails with `Process completed with exit code 1` / a Firebase authentication error, even though the build job passed.

**Lesson:** An unset or invalid `secrets.FIREBASE_TOKEN` makes `npx firebase-tools deploy --token "$FIREBASE_TOKEN"` run with an empty token, which firebase-tools rejects. GitHub substitutes an empty string for a missing secret — there is no build error, only a runtime auth failure in the deploy step. Fix requires a human: run `npx firebase-tools login:ci`, store the token as the `FIREBASE_TOKEN` repo secret, and re-run. Guard against this by checking the secret in a dedicated step (added in `deploy.yml`) so the failure is self-explanatory. Also note `FIREBASE_TOKEN`/`--token` auth is deprecated by firebase-tools in favor of `GOOGLE_APPLICATION_CREDENTIALS`/service-account keys.

**Status:** Superseded by the service-account path (below)

## Firebase CI deploy should use a service-account key, not `FIREBASE_TOKEN`

**Apply when:** Authenticating the Firebase deploy step in CI.

**Lesson:** `FIREBASE_TOKEN`/`--token` (from `login:ci`) is deprecated by firebase-tools and will be removed in a future major version. The supported replacement is a service-account key exposed as `GOOGLE_APPLICATION_CREDENTIALS`. In `deploy.yml` the deploy job now: (1) decodes the base64 `FIREBASE_SERVICE_ACCOUNT` secret to a temp JSON file and sets `GOOGLE_APPLICATION_CREDENTIALS`; (2) runs `firebase deploy` with no `--token` when that secret is present (ADC path); (3) falls back to the legacy `--token` path only when the service-account secret is absent. Service accounts are project-scoped, don't need browser sign-in, and their keys can be rotated. Required roles for hosting: `Firebase Hosting Admin` + `Service Account User` (plus Cloud Functions/Cloud Run Admin if deploying functions or the SSR frameworks backend).

**Status:** Active

---

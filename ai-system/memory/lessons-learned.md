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

---

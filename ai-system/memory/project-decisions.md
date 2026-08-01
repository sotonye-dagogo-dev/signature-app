# Project Decisions

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Log of significant architectural, technical, and product decisions.

---

## Decisions

## Image-to-SVG Client-Side Conversion Approach

**Decision:** Use canvas-based pixel tracing with embedded SVG fallback for raster-to-SVG conversion
**Date:** 2026-07-21
**Made by:** implementer
**Supersedes:** None
**Superseded by:** None

**Reason:**
The backend API only accepts SVG format for G-code conversion. For raster images (PNG, JPEG, etc.), client-side conversion to SVG is required. The pixel tracing approach generates actual vector paths from pixel data (good for signatures/drawings). An embedded-image SVG fallback is used when the tracing produces insufficient results.

**Alternatives Considered:**
- Server-side conversion: Would require backend changes, additional latency
- Library-based tracing (Potrace): Would add dependency, licensing concerns
- Manual tracing: Impractical for end users

**Implications:**
- Raster images with high detail may produce large SVGs
- Pixel tracing works best for high-contrast images (signatures, drawings)
- Embedded SVGs will work but may not produce optimal G-code

---

## Firebase Hosting CI/CD via GitHub Actions

**Decision:** Automate build + deploy to Firebase Hosting through GitHub Actions on push/merge to `main`, with build-only validation on PRs
**Date:** 2026-08-01
**Made by:** implementer (copilot-swe-agent)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The directive requires automatic deployment when commits are pushed or PRs are merged to `main`. `deploy.yml` runs the Angular build (via `build-with-cleanup.cjs`) and then `firebase deploy --only hosting` using a `FIREBASE_TOKEN` repository secret. Workflow token permissions are scoped to `contents: read` per GitHub security guidance.

**Alternatives Considered:**
- Manual deployment: rejected — directive explicitly requires automation
- Firebase GitHub action (`w9jds/firebase-action`): not used — raw `firebase-tools` via `npx` keeps the pipeline dependency-light
- Multi-branch deploy (staging per PR): deferred — only `main` is deployed for now

**Implications:**
- A `FIREBASE_TOKEN` secret must exist in the repo for the deploy step to authenticate
- Build runs twice (once in build job, once in deploy job); could be consolidated with artifacts later
- `environment.ts` is regenerated at build time from `.env`, so the committed file is a placeholder/fallback

---

## Signing Key as Committed Fallback + Build-Time Env Injection

**Decision:** Keep `BACKEND_SIGNING_KEY` in `.env` for build-time injection, with the plaintext value committed in `environment.ts` as a fallback
**Date:** 2026-08-01
**Made by:** implementer (copilot-swe-agent)
**Supersedes:** earlier env-script approach
**Superseded by:** None

**Reason:**
The signing key is not a high-value secret (per the project owner, secrecy is not a concern), but keeping it configurable in `.env` lets CI inject it without hardcoding in the workflow. The build/dev wrapper scripts encrypt it per-build using AES-CBC (`keyDerivationSalt`, `iv`) and write the plaintext key as the static fallback so the app always has a valid value even if `.env` is absent.

**Alternatives Considered:**
- Hardcode in workflow file: rejected — less flexible and mixes config with CI
- Full encryption only (no plaintext): rejected — no decrypt path in the app; encryption is obfuscation only

**Implications:**
- `.env.example` documents the required variable; `.env` is gitignored
- `npm run build` (build-with-cleanup.cjs) and `npm start` (dev-with-env.cjs) both require `.env` to exist

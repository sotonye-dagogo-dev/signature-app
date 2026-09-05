# Development History

> **Metadata**
>
> - last-updated-by: execute-feature (2026-09-05 frontend hardening)
> - last-verified-against-code: 2026-09-05
> - staleness-policy: historical entries do not go stale

> **Overview:** Chronological log of completed development work.

---

## History

---

## 2026-07-21 — Project Initialization

**Summary:**
Project repository already exists with Angular 18 standalone components, Tailwind CSS, signature pad canvas, Bluetooth control, and evaluation features. AI system documentation installed and populated with project-specific content via bootstrap.

**Completed:**

- ai-system directory created with all template files
- Project scan completed
- All ai-system documentation files written with project-specific content
- Task queue populated with camera/image SVG feature as current task

**Key Changes:**

- None — initial ai-system setup

**Next Sprint Focus:**
Implement camera/image input → SVG conversion feature for the signature pad

---

## 2026-07-21 — Camera/Image-to-SVG Feature

**Summary:**
Implemented the camera/image import feature for the signature pad. Users can now click a camera button, select an image file (SVG, PNG, JPEG, GIF, etc.), preview and edit it (invert colors, adjust threshold), and send it through the G-code conversion pipeline — reusing the existing feedback display component.

**Completed:**

- New ImageToSvgModalComponent with file upload, SVG preview, invert, and threshold controls
- Camera button added to signature pad controls with purple styling
- Full pipeline: image → SVG conversion (client-side) → G-code API → result display via existing feedback component
- Supports both SVG files (used directly) and raster images (converted via canvas pixel tracing with fallback to embedded SVG)
- Unit tests for modal component

**Key Changes:**

- New component: `image-to-svg-modal` (standalone, 350 lines)
- Modified: `signature-pad` component (camera button + SVG processing integration)
- 4 new files, 3 modified files

**Next Sprint Focus:**
Verify build passes with compatible Node.js version and run tests

---

## 2026-08-01 — CI/CD Pipeline & Signing Key Handling

**Summary:**
Set up automated CI/CD for Firebase Hosting deployment. GitHub Actions now builds on PRs to `main` and builds + deploys to Firebase Hosting on pushes to `main`. The signing key (`BACKEND_SIGNING_KEY`) is sourced from a `.env` file at build time and injected into `src/environment/environment.ts` via an encrypt-then-write build script, with the plaintext value also committed as a static fallback.

**Completed:**

- `.github/workflows/deploy.yml` — build on PR, build + `firebase deploy --only hosting` on push to main (scoped `contents: read` token)
- `build-with-cleanup.cjs` — encrypts signing key into environment.ts, runs `ng build`, restores placeholder env after build
- `dev-with-env.cjs` — dev-server wrapper injecting env vars into environment.ts for local runs
- `.env.example` — template for `BACKEND_SIGNING_KEY`
- `src/environment/environment.ts` — signing key + per-build encrypted key triple (`encryptedSigningKey`, `keyDerivationSalt`, `iv`)
- README CI/CD section documenting `FIREBASE_TOKEN` secret requirement

**Key Changes:**

- New: `.github/workflows/deploy.yml`, `build-with-cleanup.cjs`, `dev-with-env.cjs`, `.env.example`
- Modified: `src/environment/environment.ts`, `README.md`

**Next Sprint Focus:**
Enable the workflow (requires `workflows` permission on the GitHub App) and confirm a real push-to-main deploy succeeds end-to-end.

---

## 2026-08-01 — Firebase Deploy Failure Diagnosis

**Summary:**
GitHub Actions run #3 passed the `build` job but the `deploy` job failed at "Deploy to Firebase Hosting" (exit code 1) with a Firebase authentication error. Diagnosis: `secrets.FIREBASE_TOKEN` is unset/invalid, so `firebase-tools` runs with an empty token. The workflow was hardened (secret guard step, explicit `--project signature-eu`, `--non-interactive`) and the README now documents exact secret setup. Resolution is blocked on a human configuring the `FIREBASE_TOKEN` repo secret.

**Completed:**

- Root-caused run #3 deploy failure to missing/invalid `FIREBASE_TOKEN` secret
- Added "Check Firebase token secret" guard step to `deploy.yml` (fail-fast with instructions)
- Pinned deploy target explicitly (`--project signature-eu`) and added `--non-interactive`
- Documented `firebase login:ci` → repo secret setup in README
- Reconciled all 41 ai-system docs against post-CI/CD repo state

**Key Changes:**

- Modified: `.github/workflows/deploy.yml`, `README.md`
- Modified: `ai-system/` (41 docs) — metadata refresh + CI/CD sprint reconciliation

**Next Sprint Focus:**
Configure the `FIREBASE_TOKEN` repository secret (human action required) and re-run the deploy workflow to confirm a green end-to-end deploy.

---

## 2026-08-01 — Service-Account Deploy Auth (Long-Term Fix)

**Summary:**
Replaced the deprecated `FIREBASE_TOKEN`-only auth with a preferred service-account path. `deploy.yml` now decodes the `FIREBASE_SERVICE_ACCOUNT` (base64 service-account JSON key) secret into a temp credentials file, exports `GOOGLE_APPLICATION_CREDENTIALS`, and deploys via Application Default Credentials. The legacy `--token` path remains as an automatic fallback when only `FIREBASE_TOKEN` is set, and a guard step fails fast with setup instructions if neither secret is configured.

**Completed:**

- `deploy.yml`: added "Set up Firebase service account credentials" step (decode base64 → `GOOGLE_APPLICATION_CREDENTIALS`)
- `deploy.yml`: split deploy into two mutually-exclusive steps — service-account/ADC path and token fallback
- `deploy.yml`: updated credential guard to check both secrets (`FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_TOKEN`)
- README: documented service-account setup (IAM roles, key download, base64 encoding, secret creation) as the recommended path, with `FIREBASE_TOKEN` demoted to a legacy fallback
- ai-system docs updated to reflect the new auth preference

**Key Changes:**

- Modified: `.github/workflows/deploy.yml`, `README.md`
- Modified: `ai-system/` — lessons-learned, project-decisions, system-architecture, task-queue, dev-history

**Next Sprint Focus:**
A human creates the service account, stores its base64 JSON key as `FIREBASE_SERVICE_ACCOUNT`, then verifies an end-to-end push-to-main deploy.

---

## 2026-09-05 — Frontend Hardening: Loading Phases, Disabled States, Sanitized Errors

**Summary:**
Hardened the image-upload → SVG → G-code end-to-end flow and applied platform-wide non-breaking UX fixes. Fixed the `Http failure response for https://.../api/convert: 0 Unknown Error` leak by sanitizing all service error paths to never reveal backend URLs, mapping status 0 to a friendly "Unable to connect..." message. Added phase-specific loading feedback and disabled states for every submit/convert/search/evaluate action so users never feel stuck.

**Completed:**

- `GcodeService`: added `sanitizeMessage()` + `case 0` handling, refactored `convertSvgToGcode` to `tap`+`filter(Response)`+`map(body)` (no null returns), removed stray `processing:50%` tap, sanitized console.error
- `EvaluationService` & `DbService`: same sanitize helper + status 0 mapping
- `SignaturePadComponent`: introduced `isConverting`, shared `startGcodeConversion()` helper, single `progress$` subscription with `takeUntil(destroy$)`, spinner + disabled controls on all buttons; proper cleanup on feedback close
- `ImageToSvgModalComponent`: added `loadingPhase`/`loadingMessage`/`canConfirm`, disabled Change/Invert/Threshold/Confirm during processing
- `SignatureSubmissionFormComponent`: disables form while `isSubmitting` and re-enables with faculty-dependent department handling
- `EvaluationComponent` & `QueryComponent` & `FileDrop`: disabled inputs/buttons while evaluating/searching
- Build verified (`710k main` / `755k initial total`, prerendered 5 routes)

**Key Changes:**

- Modified: `src/app/services/gcode/gcode.service.ts`, `src/app/services/evaluation/evaluation.service.ts`, `src/app/services/db/db.service.ts`
- Modified: `src/app/components/signature-pad/*`, `src/app/components/image-to-svg-modal/*`, `src/app/components/signature-submission-form/*`, `src/app/pages/evaluation/*`, `src/app/pages/query/*`
- Modified: `ai-system/design-system.md`, `ai-system/system-architecture.md`, `ai-system/repair-system.md`

**Next Sprint Focus:**
Configure `FIREBASE_SERVICE_ACCOUNT` (still pending human action) and verify push-to-main deploy; add unit tests for new `isConverting`/`loadingPhase` states.

---



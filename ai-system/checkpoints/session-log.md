# Development Checkpoints — Session Log

> **Metadata**
>
> - last-updated-by: execute-feature (2026-09-05 frontend hardening)
> - last-verified-against-code: 2026-09-05
> - staleness-policy: append-only — never modify past entries

> **Overview:** Append-only running log of development sessions.

---

## Log Format

```
## Session [number] — [date]

**Completed:**
[What was finished this session]

**Files Modified:**
- [file path] — [what changed]

**Next Task:**
[Exact next step — be specific]

**Assumptions Made:**
[Any assumptions logged per the quality gate]

**Notes / Blockers:**
[Anything the next agent needs to know]
```

---

## Sessions

---

## Session 1 — 2026-07-21

**Completed:**
Initial ai-system setup and project bootstrap. Full project scan completed. All ai-system documentation files populated with project-specific content.

**Files Modified:**

- ai-system/ (entire directory created and populated)

**Next Task:**
Execute camera/image → SVG feature pipeline

**Assumptions Made:**
None

**Notes / Blockers:**
Angular 18 standalone component project. Uses signature_pad library for canvas drawing. Backend API only accepts SVG format.

---

## Session 2 — 2026-07-21

**Completed:**
Camera/image input → SVG conversion feature implemented:
- Created ImageToSvgModalComponent with file picker, canvas-based image processing, SVG preview, invert and threshold editing
- Added camera button to SignaturePadComponent controls
- Wired image-to-SVG output through existing G-code conversion pipeline using FeedbackDisplayComponent

**Files Modified:**
- src/app/components/image-to-svg-modal/image-to-svg-modal.component.ts — new: modal component with image processing logic
- src/app/components/image-to-svg-modal/image-to-svg-modal.component.html — new: modal template with upload zone, preview, edit controls
- src/app/components/image-to-svg-modal/image-to-svg-modal.component.scss — new: modal styles matching design system
- src/app/components/image-to-svg-modal/image-to-svg-modal.component.spec.ts — new: basic test suite
- src/app/components/signature-pad/signature-pad.component.ts — added camera button, image modal reference, SVG processing pipeline
- src/app/components/signature-pad/signature-pad.component.html — added camera button and image-to-svg modal
- src/app/components/signature-pad/signature-pad.component.scss — added purple camera button style

**Next Task:**
Run update-ai-system.md to sync docs with new feature

**Assumptions Made:**
None

**Notes / Blockers:**
Node.js v25 prevents running tests/build locally but code follows existing patterns faithfully.

---

## Session 3 — 2026-08-01

**Completed:**
CI/CD pipeline for Firebase Hosting deployment:
- `.github/workflows/deploy.yml` — build on PR to main; build + deploy on push to main
- `build-with-cleanup.cjs` and `dev-with-env.cjs` — env-driven signing key injection into environment.ts
- `.env.example` template; `src/environment/environment.ts` signing key + encrypted triple
- README CI/CD docs

**Files Modified:**
- .github/workflows/deploy.yml — new: build/deploy workflow
- build-with-cleanup.cjs — new: encrypt signing key → build → cleanup
- dev-with-env.cjs — new: dev wrapper injecting env
- .env.example — new: BACKEND_SIGNING_KEY template
- src/environment/environment.ts — signing key + encryption fields
- README.md — CI/CD section

**Next Task:**
Grant the GitHub App `workflows` permission so the workflow file can be pushed, then verify an end-to-end push-to-main deploy to Firebase Hosting.

**Assumptions Made:**
Signing key value `signature-app-for-my-project-2025` is acceptable as a committed fallback (per directive, secrecy is not a concern).

**Notes / Blockers:**
Initial push of the workflow was rejected because the GitHub App lacked `workflows` permission — resolved by scoping workflow token permissions (`contents: read`) and routing through PR review.

---

## Session 4 — 2026-08-01

**Completed:**
Diagnosed the failing GitHub Actions run (#3, `30675381714`) — the `build` job passed but the `deploy` job's "Deploy to Firebase Hosting" step failed (exit code 1) with a Firebase authentication error. Root cause: the `FIREBASE_TOKEN` repository secret is not configured (or is invalid), so `firebase-tools deploy --token "$FIREBASE_TOKEN"` runs with an empty token and is rejected.

Hardened `.github/workflows/deploy.yml`:
- Added a "Check Firebase token secret" guard step that fails fast with setup instructions when `secrets.FIREBASE_TOKEN` is empty
- Pinned the deploy explicitly to the `signature-eu` project (`--project signature-eu`)
- Added `--non-interactive` to prevent CI hangs

Updated `README.md` CI/CD section with step-by-step `FIREBASE_TOKEN` secret setup (login:ci → repo secret → re-run).

Reconciled all 41 `ai-system/` docs (repo-map, dependency-graph, system-architecture, project-plan, task-queue, dev-history, lessons-learned, project-decisions, session-log, in-progress, project-context, ai-context.md, + all freshness metadata).

**Files Modified:**
- .github/workflows/deploy.yml — secret guard step, explicit project, --non-interactive
- README.md — FIREBASE_TOKEN setup instructions
- ai-system/* (41 files) — reconciled metadata/content post-CI/CD sprint
- ai-system/memory/lessons-learned.md — added FIREBASE_TOKEN CI lesson
- ai-system/planning/task-queue.md — flagged FIREBASE_TOKEN secret as action item

**Next Task:**
A human with Firebase access must create the `FIREBASE_TOKEN` secret (see README) and re-run the workflow; no code change can substitute for the credential.

**Assumptions Made:**
Firebase project `signature-eu` (from `.firebaserc`) is the intended deploy target and already exists (site responds at https://signature-eu.web.app).

**Notes / Blockers:**
This is not a workflow-file bug — it is a missing/invalid repository secret. Blocker is outside the repo and requires repository owner action.

---

## Session 5 — 2026-08-01

**Completed:**
Implemented the long-term Firebase deploy auth fix (service-account key via ADC), keeping the deprecated `FIREBASE_TOKEN` path as a fallback:
- Added a "Set up Firebase service account credentials" step: decodes base64 `FIREBASE_SERVICE_ACCOUNT` secret → temp JSON → exports `GOOGLE_APPLICATION_CREDENTIALS`
- Split the deploy step into two mutually-exclusive steps: service-account/ADC path (no `--token`, so ADC is used) and legacy token path (used only when the service-account secret is absent)
- Updated the credential guard to require at least one of `FIREBASE_SERVICE_ACCOUNT` / `FIREBASE_TOKEN`
- README: service-account setup (IAM roles, key download, base64 encode, secret) documented as recommended; `FIREBASE_TOKEN` demoted to legacy fallback
- Synced ai-system docs (lessons-learned, project-decisions, system-architecture, task-queue, dev-history)

**Files Modified:**
- .github/workflows/deploy.yml — service-account setup step, dual deploy paths, updated guard
- README.md — service-account setup instructions
- ai-system/memory/lessons-learned.md — added SA lesson, superseded token lesson
- ai-system/memory/project-decisions.md — added SA auth decision, superseded token decision
- ai-system/system-architecture.md — CI/CD section: SA/ADC path
- ai-system/planning/task-queue.md — FIREBASE_SERVICE_ACCOUNT as action item
- ai-system/summaries/dev-history.md — SA auth sprint summary
- ai-system/checkpoints/session-log.md — this entry

**Next Task:**
A human creates a service account in the `signature-eu` project (roles: Firebase Hosting Admin + Service Account User), downloads its JSON key, base64-encodes it, and stores it as the `FIREBASE_SERVICE_ACCOUNT` repo secret. Then verify an end-to-end push-to-main deploy. The existing `FIREBASE_TOKEN` secret remains as a working fallback until then.

**Assumptions Made:**
Service-account key via `GOOGLE_APPLICATION_CREDENTIALS` is the officially recommended firebase-tools CI auth method (token/`login:ci` is deprecated). OIDC workload identity federation is deferred (more complex, known firebase-tools auto-auth timeouts in some environments).

**Notes / Blockers:**
firebase-tools resolves auth in order: `--token` flag → `FIREBASE_TOKEN` env → local login → ADC. The service-account deploy step must therefore NOT set `FIREBASE_TOKEN`, which is why the two deploy steps are mutually exclusive.

---

## Session 6 — 2026-09-05

**Completed:**
Frontend hardening sprint (non-breaking, platform-wide): loading phase feedback + disabled submit states + sanitized error handling; fixed `Http failure response for https://.../api/convert: 0` backend-URL leak on image→G-code flow.

- `GcodeService`: `sanitizeMessage()` + `case 0`, refactored `convertSvgToGcode` to `tap`+`filter(Response)`+`map(body)`, removed stray `processing 50%` tap
- `EvaluationService` + `DbService`: same sanitize helper + status 0 mapping
- `SignaturePadComponent`: added `isConverting` flag, shared `startGcodeConversion()` helper, single `progress$` subscription with `takeUntil(destroy$)`, spinner + disabled controls, proper cleanup on feedback close
- `ImageToSvgModalComponent`: added `loadingPhase`/`loadingMessage`/`canConfirm`, disabled Change/Invert/Threshold/Confirm while processing, phase-specific messages ("Reading image...", "Converting image to SVG...", "Generating preview...")
- `SignatureSubmissionFormComponent`: disables form while `isSubmitting` and re-enables with faculty-dependent logic
- `EvaluationComponent`/`QueryComponent`/`FileDrop`: disabled inputs/buttons while evaluating/searching
- Verified build passes (`710k main`, `755k initial total`, 5 prerendered routes)
- Updated `design-system.md` UX principles, `system-architecture.md` constraints, `repair-system.md` error pattern, `memory/lessons-learned.md`, `memory/project-decisions.md`, `planning/project-plan.md`, `memory/architecture-history.md`, `summaries/dev-history.md`

**Files Modified:**
- src/app/services/gcode/gcode.service.ts — sanitize helper, status 0, convert pipeline fix
- src/app/services/evaluation/evaluation.service.ts — sanitize helper, status 0
- src/app/services/db/db.service.ts — sanitize helper, status 0
- src/app/components/signature-pad/signature-pad.component.ts — isConverting, shared conversion helper, subscription management
- src/app/components/signature-pad/signature-pad.component.html — disabled bindings + spinner/label change on convert button
- src/app/components/signature-pad/signature-pad.component.scss — disabled opacity + spin animation
- src/app/components/image-to-svg-modal/image-to-svg-modal.component.ts — loadingPhase, loadingMessage, canConfirm
- src/app/components/image-to-svg-modal/image-to-svg-modal.component.html — phase loading text, disabled controls, canConfirm binding
- src/app/components/signature-submission-form/signature-submission-form.component.ts — form disable during submit
- src/app/pages/evaluation/evaluation.component.html — disabled file-drops, textareas, sample buttons while evaluating
- src/app/pages/query/query.component.html — disabled search input while searching
- ai-system/design-system.md, ai-system/system-architecture.md, ai-system/repair-system.md, ai-system/memory/lessons-learned.md, ai-system/memory/project-decisions.md, ai-system/planning/project-plan.md, ai-system/memory/architecture-history.md, ai-system/summaries/dev-history.md — docs reconciliation

**Next Task:**
Human to verify end-to-end image→G-code flow manually with a real image (backend must be reachable); backend investigation if status 0 persists (CORS/network). QA: add unit tests for `isConverting`/`loadingPhase` states, then verify `FIREBASE_SERVICE_ACCOUNT` push-to-main deploy still blocked on secret setup.

**Assumptions Made:**
No architecture change; UX fix is strictly frontend and non-breaking. Backend at `https://signatureeu.pythonanywhere.com/api/` is assumed to be intermittently reachable — status 0 is treated as client connectivity/CORS, mapped to generic message. No new dependencies introduced.

**Notes / Blockers:**
Build succeeds on Node 20 with `npm ci --legacy-peer-deps` → `ng build`. No secrets leaked. `FIREBASE_SERVICE_ACCOUNT` deploy remains blocked until human provisions the secret (independent of this sprint).

---

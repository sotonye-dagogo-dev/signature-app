# Repair System — Error Knowledge Base

> **Metadata**
> - last-updated-by: execute-feature (2026-09-05 frontend hardening)
> - last-verified-against-code: 2026-09-05
> - staleness-policy: individual entries may be stale if the code has changed around them — verify fix still applies before reusing

> **Overview:** Living knowledge base of errors encountered during development, their root causes, and how they were fixed. Agents must search this before diagnosing new errors and log every fixed bug to prevent recurrence.

---

## How to Use

- **Before debugging:** Search this file for patterns matching the current error
- **After fixing a bug:** Add an entry using the template below
- **If a fix no longer applies:** Mark the entry as `[SUPERSEDED]` and link to the new entry

---

## Error Log

### [TEMPLATE]

```
## [Error Title]

**Symptom:**
[What the developer or user sees]

**Root Cause:**
[The actual technical reason]

**Fix Applied:**
[What change was made]

**Prevention:**
[How to avoid this in future]

**Files Affected:**
[list of files]

**Date:** [YYYY-MM-DD]
**Status:** [Active / Superseded]
```

---

## Known Error Patterns

### Angular

**Hydration Mismatch (SSR)**
- Symptom: `Hydration failed because the initial UI does not match what was rendered on the server`
- Cause: Browser-only logic (window, localStorage, devicePixelRatio) running during server render
- Fix: Wrap in `isPlatformBrowser(this.platformId)` check before accessing browser APIs
- Prevention: Always inject `PLATFORM_ID` and use `isPlatformBrowser()` before browser API access

**Canvas Not Available (SSR)**
- Symptom: `Cannot read properties of null (reading 'getContext')` during server render
- Cause: Canvas element not available in SSR environment
- Fix: Only initialize signature pad in `ngAfterViewInit` after `isPlatformBrowser` check
- Prevention: All canvas/signature pad logic gated behind platform browser check

### Node.js / Backend

**CORS Errors with PythonAnywhere API**
- Symptom: `Access-Control-Allow-Origin` missing in browser requests
- Cause: Backend CORS not configured for dev origin
- Fix: Configure CORS on backend or use proxy in dev
- Prevention: Test with production API directly or configure dev proxy

### Configuration / Environment

**Missing Environment Variables in Build**
- Symptom: `undefined` values for API URLs in production
- Cause: Environment file not bundled correctly or wrong environment selected
- Fix: Verify production flag in environment.ts matches deployment
- Prevention: Check environment.ts configuration before deployment

### HTTP Failure 0 — Backend URL Leaked in Error Feedback

**Symptom:** `Http failure response for https://signatureeu.pythonanywhere.com/api/convert: 0 Unknown Error` shown in feedback display after "Upload image and convert to G-code"

**Root Cause:**
- `HttpClient` error `status: 0` (network unreachable, CORS, offline) surfaces `error.message` containing the full request URL. `GcodeService.handleError` previously did `error.error?.details || error.message` without sanitizing, so the URL propagated via `throwError` → component `subMessage: error` → `FeedbackDisplayComponent`.

**Fix Applied:**
- Added `sanitizeMessage()` helper in `GcodeService`, `EvaluationService`, `DbService` that strips `https?://` substrings and maps `Http failure response ... 0 ...` to a generic message. `handleError` now handles `case 0` explicitly: "Unable to connect to the service. Please check your internet connection and try again."
- `GcodeService.convertSvgToGcode` refactored to use `tap` + `filter(Response)` + `map(body)` instead of returning `null` for progress events; removed erroneous `tap` that set `processing: 50%` on every event.
- `SignaturePadComponent` hardened: `isConverting` flag disables all controls and shows spinner, single managed `progress$` subscription with `takeUntil(destroy$)` (no leak), distinct `startGcodeConversion()` helper reused for canvas and image flows, proper cleanup on `onGCodeFeedbackClose`.
- `ImageToSvgModalComponent` enhanced with `loadingPhase` (`reading`/`converting`/`processing`) and `loadingMessage`, `canConfirm` getter, disabled states for change/threshold/invert/confirm while `isLoading`.

**Prevention:**
- Never surface `HttpErrorResponse.message` directly; always map through sanitize helper and explicit status cases.
- All async submit/convert actions must set an `isConverting`/`isSubmitting`/`isEvaluating` flag, bind `[disabled]` on buttons/inputs, and show spinner/progress.
- Centralize G-code conversion into one helper to avoid divergent error/progress paths.

**Files Affected:**
- `src/app/services/gcode/gcode.service.ts`, `src/app/services/evaluation/evaluation.service.ts`, `src/app/services/db/db.service.ts`
- `src/app/components/signature-pad/signature-pad.component.ts`, `src/app/components/signature-pad/signature-pad.component.html`, `src/app/components/signature-pad/signature-pad.component.scss`
- `src/app/components/image-to-svg-modal/image-to-svg-modal.component.ts`, `src/app/components/image-to-svg-modal/image-to-svg-modal.component.html`
- `src/app/components/signature-submission-form/signature-submission-form.component.ts`
- `src/app/pages/evaluation/evaluation.component.html`, `src/app/pages/query/query.component.html`, `src/app/components/file-drop/file-drop.component.ts` (disabled binding)

**Date:** 2026-09-05
**Status:** Active

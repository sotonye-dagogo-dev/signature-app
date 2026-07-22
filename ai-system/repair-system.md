# Repair System — Error Knowledge Base

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-07-21
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

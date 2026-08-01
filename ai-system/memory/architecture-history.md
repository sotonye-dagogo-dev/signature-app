# Architecture History

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
> - staleness-policy: historical entries do not go stale

> **Overview:** Chronological record of how the system architecture has evolved.

---

## History

### 2026-07-21 — Initial Architecture

**State:**
Single-page Angular 18 application with standalone components. Service layer for API communication, Bluetooth, and Arduino control. Feature pages: home (signature pad), device-setup, query, evaluation. No backend code in repo — external PythonAnywhere API.

**Rationale:**
Angular 18 standalone components reduce boilerplate. External API keeps the frontend focused on UX. signature_pad library chosen for reliable canvas-based signature capture.

### 2026-08-01 — CI/CD & Build Tooling Added

**State:**
GitHub Actions CI/CD pipeline added: build on PRs to `main`, build + Firebase Hosting deploy on pushes to `main`. Build-time environment injection introduced via `build-with-cleanup.cjs` (production) and `dev-with-env.cjs` (development), which read `BACKEND_SIGNING_KEY` from `.env` and write an encrypted key triple into `src/environment/environment.ts`. Angular SSR frameworks backend enabled in `firebase.json`.

**Rationale:**
Automate deployment so pushes/merges to `main` reach Firebase Hosting without manual steps. Moving signing-key material into build-time env injection keeps a single source of truth (`.env`/CI secret) while preserving a plaintext fallback in the committed env file.

**Key Changes:**
- New `.github/workflows/deploy.yml` (build + deploy) and `.github/workflows/opencode.yml` (OpenCode comment triggers)
- New root build scripts: `build-with-cleanup.cjs`, `dev-with-env.cjs`
- New `.env.example`; `src/environment/environment.ts` now carries `signingKey`, `encryptedSigningKey`, `keyDerivationSalt`, `iv`

# Development History

> **Metadata**
>
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
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

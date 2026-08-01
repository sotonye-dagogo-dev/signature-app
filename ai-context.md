# Project AI Context

> **Metadata**
>
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
> - staleness-policy: re-verify before trusting if project structure has changed

> **Overview:** Project overview — the very first file any AI agent should read. Provides a 30-second orientation to what this project is, what stack it uses, and where to find everything.

---

## Quick Reference

| Field            | Value                                   |
| ---------------- | --------------------------------------- |
| Project Name     | SignatureApp                            |
| Type             | Web App (Angular SPA with SSR)          |
| Primary Language | TypeScript                              |
| Frontend         | Angular 18 (standalone components)      |
| Backend          | External Python API (PythonAnywhere)    |
| Database         | External (backend-managed)              |
| Styling          | Tailwind CSS + SCSS                     |
| Deployment       | Firebase Hosting (via GitHub Actions)   |

---

## Key Modules

| Module                | Location                              | Purpose                                   |
| --------------------- | ------------------------------------- | ----------------------------------------- |
| Signature pad         | src/app/components/signature-pad/     | Canvas signature drawing, SVG/G-code      |
| Submission form       | src/app/components/signature-submission-form/ | HMAC-signed submission form     |
| G-code conversion     | src/app/services/gcode/               | Convert SVG → G-code, parse results       |
| Bluetooth / Arduino   | src/app/services/bluetooth, arduino/  | Device connection + G-code execution      |
| Evaluation            | src/app/pages/evaluation/             | Signature quality assessment UI           |
| Query                 | src/app/pages/query/                  | Retrieve signatures by email              |
| Image-to-SVG modal    | src/app/components/image-to-svg-modal/| Raster image → SVG pipeline               |

---

## Entry Point

The AI system documentation lives in `ai-system/`.

Start with: `ai-system/protocols/entry-protocol.md`

---

## Active Development Focus

CI/CD pipeline for Firebase Hosting is in place (GitHub Actions builds on PRs to `main`, deploys on push to `main`). The deploy step currently fails with a Firebase auth error until the `FIREBASE_TOKEN` repository secret is configured — a human action documented in README.md.

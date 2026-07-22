# Project Plan

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-21
> - staleness-policy: re-verify if project scope or phase changes

> **Overview:** High-level feature checklist organized by development phase.

---

## Phase 1 — Foundation

- [x] Angular standalone project scaffolding
- [x] Tailwind CSS + SCSS styling setup
- [x] FontAwesome icon integration
- [x] Vite build configuration
- [x] SSR with Express server
- [x] Routing structure with lazy loading
- [x] Firebase deployment config
- [x] CI/CD pipeline (GitHub Actions)
- [x] Dark/light mode theme toggle

---

## Phase 2 — Core Features

- [x] Digital signature pad with canvas drawing
- [x] Undo/redo for signature strokes
- [x] Clear canvas
- [x] Download signature as SVG
- [x] Convert SVG to G-code (backend API)
- [x] Submit signature with user details (HMAC-signed)
- [x] Reusable modal component
- [x] Progress/feedback display component

---

## Phase 3 — Secondary Features

- [x] Bluetooth device scanning/connecting/pairing
- [x] Arduino G-code command execution via Bluetooth
- [x] Signature query by email (with caching)
- [x] Signature quality evaluation (SSIM, smoothness, execution error)
- [x] File drag-and-drop upload
- [x] Camera/image input → SVG conversion pipeline

---

## Phase 4 — Quality & Polish

- [ ] Unit test coverage for core modules
- [ ] Integration tests for critical paths
- [ ] Performance audit and optimisation
- [ ] Accessibility audit
- [ ] Error states and loading states complete

---

## Phase 5 — Launch Preparation

- [ ] Production environment configured
- [ ] Security audit (auth, input validation, secrets)
- [ ] Documentation complete
- [ ] Deployment pipeline tested

---

## Completed

- [x] Phase 1 — Foundation (complete)
- [x] Phase 2 — Core Features (complete)
- [x] Bluetooth control + Arduino integration
- [x] Signature query + evaluation

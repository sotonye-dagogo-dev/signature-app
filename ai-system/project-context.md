# Project Context

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-07-21
> - staleness-policy: re-verify if >10 sessions old or after major scope changes

> **Overview:** Why this project exists, who it serves, and what constraints govern development. Agents should read this to understand the "why" behind the work.

---

## Project Purpose

Digital signature creation and G-code conversion platform. Users draw signatures on a canvas, then submit them with personal details (name, email, role, faculty, department) via an HMAC-signed API. The backend converts SVGs to G-code for Arduino-based pen plotters. Also includes signature quality evaluation (SSIM, smoothness, execution error) and Bluetooth-based device control for sending G-code commands to connected hardware.

---

## Target Users

| User Type | Needs | Key Interactions |
|-----------|-------|-----------------|
| End Users (signers) | Draw digital signature, submit with personal info, download SVG/G-code | Canvas drawing, form submission, download |
| Device Operators | Connect to Arduino via Bluetooth, send G-code, monitor execution | Bluetooth scanning, pairing, command sending |
| Evaluators | Assess signature reproduction quality | File upload, SSIM/smoothness/error evaluation |

---

## Business Constraints

- Must work in modern browsers (Chrome, Firefox, Edge, Safari)
- Must support mobile touch input for signature drawing (touch-action: none)
- Must handle HiDPI/Retina displays
- Backend API only accepts SVG format for processing
- HMAC-SHA256 signed requests for data submission security

---

## Current Project Phase

Phase: Active Development

Active sprint focus: Camera image input → SVG conversion pipeline

---

## Tech Decisions Already Made

| Decision | Reason |
|----------|--------|
| Angular 18 standalone components | Modern Angular architecture, no NgModules needed |
| Vite build with @analogjs/vite-plugin-angular | Fast dev server and builds |
| Tailwind CSS + SCSS | Utility-first CSS with custom component styles |
| FontAwesome icons | Rich icon set with Angular integration |
| signature_pad library | Mature canvas-based signature capture |
| Karma + Jasmine testing | Standard Angular testing stack |
| Firebase Hosting | Deployment target |

---

## Out of Scope

- User authentication/accounts (submissions are anonymous with user-provided details)
- Real-time collaboration
- Native mobile apps (PWA-capable but not primary target)
- Offline mode

---

## External Integrations

| Service | Purpose | Auth Method |
|---------|---------|------------|
| Backend API (signatureeu.pythonanywhere.com) | SVG→G-code conversion, signed submission, evaluations | HMAC-SHA256 signature |
| Web Bluetooth API | Arduino device communication | Browser Bluetooth pairing |

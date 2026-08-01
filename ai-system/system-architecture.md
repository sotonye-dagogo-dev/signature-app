# System Architecture

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
> - staleness-policy: re-verify before trusting if any architecture-affecting commits have been made since last-verified-against-code

> **Overview:** How the system is structured — layers, modules, data flow, and configuration. Agents designing or changing structure must read this first.

---

## Architecture Diagram

```
Client (Browser)
     │
     ▼
┌─────────────────────────────┐
│   Presentation Layer        │
│   (Angular Standalone       │
│    Components)              │
│                             │
│  Pages: home, device-setup, │
│         query, evaluation   │
│                             │
│  Components: signature-pad, │
│   modal, feedback-display,  │
│   file-drop, header, footer,│
│   theme-toggle, etc.        │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│   Service Layer             │
│                             │
│  GcodeService  ──→ Backend  │
│  BluetoothService ─→ Web    │
│  ArduinoService   Bluetooth │
│  DbService        API       │
│  FormUtilitiesService      │
│  EvaluationService         │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│   External Services         │
│                             │
│  PythonAnywhere API         │
│  (SVG→G-code, SSIM,        │
│   smoothness, execution     │
│   error, signed submit)     │
│                             │
│  Web Bluetooth API          │
│  (HC-05/HC-06 modules)     │
└─────────────────────────────┘
```

---

## CI/CD & Deployment

```
Push/PR to main
  → GitHub Actions (deploy.yml)
    → checkout → setup Node 20 → npm ci --legacy-peer-deps
    → write .env (BACKEND_SIGNING_KEY) → npm run build (build-with-cleanup.cjs)
      → build-with-cleanup.cjs encrypts signing key into environment.ts → ng build → cleanup
    → deploy job (push to main only):
      → if FIREBASE_SERVICE_ACCOUNT secret set: decode to temp JSON → GOOGLE_APPLICATION_CREDENTIALS
      → guard: fails fast if neither FIREBASE_SERVICE_ACCOUNT nor FIREBASE_TOKEN is set
      → firebase deploy --only hosting --project signature-eu --non-interactive
        (service-account/ADC path, or --token fallback)
  → Firebase Hosting (signature-eu, public: dist/signature-app/browser)
```

- PRs to `main`: build only (validation gate)
- Pushes to `main`: build + deploy
- `opencode.yml` separately triggers OpenCode design/dev workflows on `/oc` or `/opencode` comments
- `firebase.json` rewrites all routes to `index.html` (SPA) and enables the Angular SSR frameworks backend
- Deploy prefers the `FIREBASE_SERVICE_ACCOUNT` repo secret (base64 service-account key → ADC); falls back to the legacy `FIREBASE_TOKEN` secret. See README for setup.


---

## Module Breakdown

| Module | Responsibility | Key Files | Dependencies |
|--------|---------------|-----------|--------------|
| Signature Pad | Canvas-based drawing, undo/redo, SVG export, G-code conversion trigger | signature-pad.component.ts | signature_pad, GcodeService |
| Submission Form | User details form, SVG preview, HMAC-signed submission | signature-submission-form.component.ts | FormUtilitiesService, GcodeService |
| G-code Service | API calls for convert, SSIM, smoothness, execution error, signed submit/receive | gcode.service.ts | HttpClient |
| G-code Parser | Parses/validates G-code responses | gcode-parser.service.ts | none |
| Evaluation Service | Quality evaluation API calls + G-code result parsing | evaluation.service.ts | HttpClient, GcodeParserService |
| Form Utilities | Form building, field config, faculty/department options, file validation | form-utilities.service.ts | GcodeService, GcodeParserService |
| DB Service | Signature query/retrieval by email | db.service.ts | HttpClient, GcodeService |
| Bluetooth Service | Web Bluetooth API scan/connect/pair/send | bluetooth.service.ts | Web Bluetooth API |
| Arduino Service | G-code validation, sequential command execution via Bluetooth | arduino.service.ts | BluetoothService |
| Evaluation | Signature quality assessment UI | evaluation.component.ts | EvaluationService, Modal, FileDrop, FeedbackDisplay, FormUtilities |
| Query | Retrieve signatures by email | query.component.ts | DbService, FeedbackDisplay |
| Modal | Reusable overlay dialog | modal.component.ts | none |
| Feedback Display | Progress/status/error display | feedback-display.component.ts | none |
| File Drop | Drag-and-drop file upload | file-drop.component.ts | FormUtilitiesService |
| Image-to-SVG Modal | Image file input, canvas-based raster→SVG conversion, preview with invert/threshold editing | image-to-svg-modal.component.ts | DomSanitizer |
| Theme Toggle | Dark/light mode with system preference detection | theme-toggle.component.ts | none |

---

## Data Flow

### Standard Request Flow
```
User Action (click/gesture)
  → Component method
    → Service method
      → HTTP request / Bluetooth write
        → External API / Device
      ← Response
    ← Result/failure
  ← UI update / feedback display
```

### Signature Submission Flow
```
Canvas drawing → SVG string (toSVG())
  → Modal with SignatureSubmissionForm
    → User fills name, email, role, faculty, department
    → HMAC-SHA256 signature generated
    → POST /signed/submit/
    → Success with G-code result or error
  → Feedback display
```

### G-Code Conversion Flow
```
Canvas drawing → SVG string
  → POST /convert/ (with progress tracking)
    → Server processes SVG → G-code
  ← G-code with metadata (line count, size)
  → Feedback display with download option
```

---

## Configuration Points

| Config Key | Purpose | Location | Default |
|-----------|---------|----------|---------|
| localApi | Dev API base URL | environment.ts | http://localhost:8000/api/ |
| prodApi | Production API base URL | environment.ts | https://signatureeu.pythonanywhere.com/api/ |
| localEvalApi | Dev eval API base URL | environment.ts | http://localhost:8001/api/ |
| prodEvalApi | Production eval API base URL | environment.ts | https://signatureeueval.pythonanywhere.com/api/ |
| production | Environment flag | environment.ts | false (dev) / true (build) |
| signingKey | Plaintext HMAC signing key (fallback) | environment.ts | signature-app-for-my-project-2025 |
| encryptedSigningKey | AES-CBC encrypted signing key (IV ‖ ciphertext) | environment.ts | (hex-encoded) |
| keyDerivationSalt | Random 32-byte AES key used for this build | environment.ts | (hex-encoded) |
| iv | AES-CBC initialization vector | environment.ts | (hex-encoded) |

> **Note:** `environment.ts` is regenerated at build/dev time from `.env` (`BACKEND_SIGNING_KEY`) by `build-with-cleanup.cjs` (production) or `dev-with-env.cjs` (development). The committed file holds placeholder values. The `encryptedSigningKey`/`keyDerivationSalt`/`iv` triple is per-build — signingKey is written in plaintext as the static fallback.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (standalone) | ^18.2 |
| Build | Vite + AnalogJS Angular plugin | ^1.16.2 |
| CSS | Tailwind CSS + SCSS | ^3.4 |
| Icons | FontAwesome | ^6.x |
| Signature | signature_pad | ^5.0.7 |
| Server | Express (SSR) | ^4.18 |
| Serial | serialport | ^13.0 |
| Testing | Jasmine + Karma | 5.2 / 6.4 |
| Backend | Python (external — PythonAnywhere) | — |
| Hosting | Firebase Hosting (signature-eu) | — |
| CI/CD | GitHub Actions (Node 20) | — |

---

## Known Constraints & Technical Debt

- Backend only accepts SVG for G-code conversion — any non-SVG image input must be converted to SVG client-side (handled by ImageToSvgModalComponent with pixel tracing + embedded SVG fallback)
- HMAC key derivation uses AES-CBC decryption in browser (obfuscation-level security, not true security)
- Canvas resize may lose signature data if called during active drawing
- No offline support — all features require network access to API

---

## Architecture History

See `memory/architecture-history.md` for full chronology.

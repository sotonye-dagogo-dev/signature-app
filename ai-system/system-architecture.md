# System Architecture

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-21
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

## Module Breakdown

| Module | Responsibility | Key Files | Dependencies |
|--------|---------------|-----------|--------------|
| Signature Pad | Canvas-based drawing, undo/redo, SVG export, G-code conversion trigger | signature-pad.component.ts | signature_pad, GcodeService |
| Submission Form | User details form, SVG preview, HMAC-signed submission | signature-submission-form.component.ts | FormUtilitiesService, GcodeService |
| G-code Service | API calls for convert, SSIM, smoothness, execution error, signed submit/receive | gcode.service.ts | HttpClient |
| Bluetooth Service | Web Bluetooth API scan/connect/pair/send | bluetooth.service.ts | Web Bluetooth API |
| Arduino Service | G-code validation, sequential command execution via Bluetooth | arduino.service.ts | BluetoothService |
| Evaluation | Signature quality assessment UI | evaluation.component.ts | GcodeService |
| Query | Retrieve signatures by email | query.component.ts | DbService |
| Modal | Reusable overlay dialog | modal.component.ts | none |
| Feedback Display | Progress/status/error display | feedback-display.component.ts | none |
| File Drop | Drag-and-drop file upload | file-drop.component.ts | none |
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
| production | Environment flag | environment.ts | false |
| encryptionKey | AES key for signing key decryption | environment.ts | (hex-encoded) |
| encryptedSigningKey | Encrypted HMAC signing key | environment.ts | (hex-encoded) |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (standalone) | ^18.2 |
| Build | Vite + AnalogJS Angular plugin | ^1.16.2 |
| CSS | Tailwind CSS + SCSS | ^3.4 |
| Icons | FontAwesome | ^6.x |
| Signature | signature_pad | ^5.0.7 |
| Testing | Jasmine + Karma | 5.2 / 6.4 |
| Backend | Python (external — PythonAnywhere) | — |
| Hosting | Firebase Hosting | — |

---

## Known Constraints & Technical Debt

- Backend only accepts SVG for G-code conversion — any non-SVG image input must be converted to SVG client-side (handled by ImageToSvgModalComponent with pixel tracing + embedded SVG fallback)
- HMAC key derivation uses AES-CBC decryption in browser (obfuscation-level security, not true security)
- Canvas resize may lose signature data if called during active drawing
- No offline support — all features require network access to API

---

## Architecture History

See `memory/architecture-history.md` for full chronology.

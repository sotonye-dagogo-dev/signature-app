# Dependency Graph

> **Metadata**
> - last-updated-by: execute-feature (2026-09-05 frontend hardening)
> - last-verified-against-code: 2026-09-05
> - staleness-policy: auto-regenerable — can be derived from import analysis tools.

> **Overview:** Maps how modules depend on each other.

---

## Module Dependency Map

```
SignaturePadComponent
  → SignaturePad library (canvas drawing)
  → GcodeService (convert SVG to G-code)
  → ModalComponent (submission dialog)
  → SignatureSubmissionFormComponent (form inside modal)
  → FeedbackDisplayComponent (progress/result display)
  → ImageToSvgModalComponent (camera/image → SVG)

SignatureSubmissionFormComponent
  → FormUtilitiesService (form creation, validation)
  → GcodeService (signed submission API call)
  → FeedbackDisplayComponent

GcodeService
  → HttpClient
  → environment.ts (API URLs, encryption config)

GcodeParserService
  → (standalone — parses G-code responses)

EvaluationService
  → HttpClient
  → environment.ts (eval API URLs)
  → GcodeParserService (parse G-code results)

FormUtilitiesService
  → GcodeService (faculty/department option loading)
  → GcodeParserService (validation helpers)

DbService
  → HttpClient
  → environment.ts (API URLs)
  → GcodeService (signed submission/recovery helpers)

BluetoothControlComponent
  → BluetoothService

DeviceSetupComponent
  → ArduinoService
  → BluetoothControlComponent

ArduinoService
  → BluetoothService

QueryComponent
  → DbService
  → FeedbackDisplayComponent

EvaluationComponent
  → ModalComponent
  → FileDropComponent
  → FeedbackDisplayComponent
  → FormUtilitiesService
  → EvaluationService

FileDropComponent
  → FormUtilitiesService (file validation)

ModalComponent
  → (standalone — only FontAwesome icons)

FeedbackDisplayComponent
  → (standalone — only FontAwesome icons)

HeaderComponent
  → ThemeToggleComponent
  → route.utils.ts (nav generation from routes)

FooterComponent
  → (standalone)

ImageToSvgModalComponent
  → DomSanitizer (safe HTML preview)
  → (standalone — no app module dependencies)

HomeComponent
  → SignaturePadComponent

AppComponent
  → HeaderComponent
  → FooterComponent
  → RouterOutlet
```

---

## External Dependencies

| Package | Purpose | Used In |
|---------|---------|---------|
| signature_pad | Canvas-based signature drawing | SignaturePadComponent |
| @fortawesome/angular-fontawesome | Icon library | Most components |
| @fortawesome/free-solid-svg-icons | Solid icons set | Most components |
| @angular/common/http | HTTP client | GcodeService, DbService, EvaluationService |
| @angular/router | Client-side routing | AppComponent, pages |
| @angular/forms | Reactive forms | SignatureSubmissionFormComponent, EvaluationComponent |
| @angular/ssr | Server-side rendering | server.ts, main.server.ts |
| @angular/fire | Firebase integration | — (installed, hosting via firebase-tools) |
| express | SSR HTTP server | server.ts |
| rxjs | Reactive extensions | All services |

---

## Circular Dependency Warnings

None detected.

---

## Dependency Rules

- Pages depend on Components and Services — not the other way around
- Components may depend on Services — not the other way around
- Services may depend on other Services (e.g., ArduinoService → BluetoothService, EvaluationService → GcodeParserService, DbService → GcodeService)
- Utils must have no dependencies on application modules
- Environment module must not depend on any application code
- The Angular App config must not import application code (only router/http/hydration providers)

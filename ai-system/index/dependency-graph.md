# Dependency Graph

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-21
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

SignatureSubmissionFormComponent
  → FormUtilitiesService (form creation, validation)
  → GcodeService (signed submission API call)
  → FeedbackDisplayComponent

GcodeService
  → HttpClient
  → environment.ts (API URLs, encryption config)

BluetoothControlComponent
  → BluetoothService

DeviceSetupComponent
  → BluetoothService
  → ArduinoService

ArduinoService
  → BluetoothService

QueryComponent
  → DbService

DbService
  → HttpClient

EvaluationComponent
  → GcodeService
  → FileDropComponent

FileDropComponent
  → (standalone)

ModalComponent
  → (standalone — only FontAwesome icons)

FeedbackDisplayComponent
  → (standalone — only FontAwesome icons)

HeaderComponent
  → ThemeToggleComponent

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
| @angular/common/http | HTTP client | GcodeService, DbService |
| @angular/router | Client-side routing | AppComponent, pages |
| @angular/forms | Reactive forms | SignatureSubmissionFormComponent |
| @angular/ssr | Server-side rendering | server.ts, main.server.ts |
| rxjs | Reactive extensions | All services |

---

## Circular Dependency Warnings

None detected.

---

## Dependency Rules

- Pages depend on Components and Services — not the other way around
- Components may depend on Services — not the other way around
- Services may depend on other Services (e.g., ArduinoService → BluetoothService)
- Utils must have no dependencies on application modules
- Environment module must not depend on any application code

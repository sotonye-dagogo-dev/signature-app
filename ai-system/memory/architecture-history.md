# Architecture History

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-07-21
> - staleness-policy: historical entries do not go stale

> **Overview:** Chronological record of how the system architecture has evolved.

---

## History

### 2026-07-21 — Initial Architecture

**State:**
Single-page Angular 18 application with standalone components. Service layer for API communication, Bluetooth, and Arduino control. Feature pages: home (signature pad), device-setup, query, evaluation. No backend code in repo — external PythonAnywhere API.

**Rationale:**
Angular 18 standalone components reduce boilerplate. External API keeps the frontend focused on UX. signature_pad library chosen for reliable canvas-based signature capture.

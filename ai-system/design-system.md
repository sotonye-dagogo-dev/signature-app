# Design System

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-07-21
> - staleness-policy: re-verify if UI components or styling dependencies change

> **Overview:** Visual language, component patterns, and UX principles. Agents building UI must read this before writing any frontend code.

---

## Visual Language

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| primary | #059669 (emerald-600) | buttons, links, CTAs |
| secondary | #4b5563 (gray-600) | secondary buttons, accents |
| background | #ffffff / #1f2937 (dark) | page background |
| surface | #f9fafb / #374151 (dark) | cards, modals |
| text-primary | #111827 / #f9fafb (dark) | main body text |
| text-muted | #6b7280 / #9ca3af (dark) | labels, captions |
| danger | #dc2626 (red-600) | errors, destructive actions |
| success | #059669 (emerald-600) | confirmations, download btn |
| info | #0284c7 (sky-600) | info buttons, convert btn |

### Typography

Default system font stack via Tailwind.

### Spacing Scale

Tailwind default scale: 0.25rem (4px) base unit: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64

---

## Component Patterns

### Buttons
- Primary: `btn btn-primary` — emerald background, white text, for submit/confirm actions
- Secondary: `btn btn-secondary` — gray background, for undo/redo
- Destructive: `btn btn-error` — red background, for clear/delete
- Info: `btn btn-info` — sky blue, for convert/G-code
- Success: `btn btn-success` — green, for download
- Disabled: `opacity-50 cursor-not-allowed` with `:disabled` pseudo-class
- All buttons use `flex items-center gap-2` pattern for icon + text pairs

### Forms
- Input fields: Standard HTML inputs with Tailwind styling
- Select dropdowns for role, faculty, department (with faculty-dependent filtering)
- Checkbox for consent
- Error messages: Displayed inline below fields via FormUtilitiesService
- SVG preview shown as embedded `<img>` with base64 data URI

### Navigation
- Top navigation bar (header component)
- Responsive: full links on wide screens, overflow menu on narrow
- Auto-generated from route config via route.utils.ts

### Cards / Containers
- Generic `card` class applied via Tailwind
- Used for signature pad, settings forms, query results
- Border, rounded corners, padding

### Modals / Dialogs
- `ModalComponent` — reusable with `app-modal` selector
- Size variants: sm/md/lg/xl
- Escape key closes, backdrop click closes (configurable)
- Body scroll locked when open
- Content projected via `<ng-content>`

---

## Responsive Breakpoints

| Breakpoint | Value | Target |
|------------|-------|--------|
| sm | 640px | Mobile |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Wide screens |

Buttons on mobile (<640px): icons shown, text labels hidden.

---

## UX Principles

1. Always show loading state for async actions (progress bar in feedback display)
2. Destructive actions (clear) require confirmation via alert
3. Empty canvas shows alert when attempting submit/download/convert
4. Success/error states shown in feedback display component
5. Signature pad: touch-action: none for mobile, cursor: crosshair on desktop
6. Dark mode toggle with system preference detection + localStorage persistence

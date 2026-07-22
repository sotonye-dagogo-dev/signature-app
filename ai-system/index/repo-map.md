# Repository Map

> **Metadata**
>
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-21
> - staleness-policy: auto-regenerable — can be derived from `Get-ChildItem -Recurse` or `tree` command.

> **Overview:** Visual map of the project folder structure with purpose descriptions.

---

## Folder Structure

```
signature-app/
│
├── src/
│   ├── index.html                 → Root HTML shell
│   ├── main.ts                    → Browser bootstrap entry
│   ├── main.server.ts             → SSR bootstrap entry
│   ├── styles.scss                → Global styles (Tailwind + custom)
│   ├── styles/
│   │   └── _variables.scss        → SCSS color/typography variables
│   ├── environment/
│   │   └── environment.ts         → API URLs, encryption keys
│   └── app/
│       ├── app.component.*        → Root component
│       ├── app.config.ts          → App providers (router, http, hydration)
│       ├── app.config.server.ts   → Server-specific config
│       ├── app.routes.ts          → Route definitions
│       ├── components/            → Reusable UI components
│       │   ├── header/
│       │   ├── footer/
│       │   ├── theme-toggle/
│       │   ├── signature-pad/
│       │   ├── signature-submission-form/
│       │   ├── bluetooth-control/
│       │   ├── modal/
│       │   ├── feedback-display/
│       │   ├── file-drop/
│       │   └── image-to-svg-modal/
│       ├── pages/                 → Route-level page components
│       │   ├── home/
│       │   ├── device-setup/
│       │   ├── query/
│       │   ├── evaluation/
│       │   └── not-found/
│       ├── services/              → Service layer
│       │   ├── gcode/
│       │   ├── bluetooth/
│       │   ├── arduino/
│       │   ├── db/
│       │   ├── evaluation/
│       │   └── form/
│       ├── directives/
│       │   └── bluetooth-available.directive.ts
│       └── utils/
│           └── route.utils.ts
│
├── server.ts                      → Express SSR server
├── angular.json                   → Angular CLI config
├── vite.config.ts                 → Vite build config
├── tailwind.config.js             → Tailwind CSS config
├── postcss.config.js              → PostCSS config
├── firebase.json                  → Firebase hosting config
├── package.json                   → Dependencies and scripts
├── tsconfig.json                  → Base TS config
├── tsconfig.app.json              → App TS config
├── tsconfig.spec.json             → Test TS config
│
└── ai-system/                     → AI development system
```

---

## Directory Descriptions

| Directory | Purpose | Key Files |
| --------- | ------- | --------- |
| src/app/components/ | Reusable, standalone UI components | signature-pad, modal, feedback-display, image-to-svg-modal |
| src/app/pages/ | Route-level page components | home, device-setup, query, evaluation |
| src/app/services/ | Business logic and external API access | gcode.service, bluetooth.service |
| src/app/directives/ | Angular structural directives | bluetooth-available.directive |
| src/app/utils/ | Shared utility functions | route.utils.ts |
| src/environment/ | Environment configuration | environment.ts |
| src/styles/ | SCSS variables and mixins | _variables.scss |

---

## Entry Points

| Purpose | File |
| ------- | ---- |
| Browser bootstrap | src/main.ts |
| Server bootstrap (SSR) | src/main.server.ts |
| Root HTML | src/index.html |
| Express SSR server | server.ts |
| App configuration (routes, providers) | src/app/app.config.ts |

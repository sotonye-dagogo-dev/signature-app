# Development Task Queue

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-01
> - staleness-policy: re-verify before each session

> **Overview:** Sprint-level task queue with complexity tagging.

---

## Complexity Tags

| Tag | Meaning | Recommended Command |
|-----|---------|-------------------|
| `[XS]` | Trivial — single file, known pattern | dev-cycle.md |
| `[S]` | Small — 1-3 files, well-understood | dev-cycle.md |
| `[M]` | Medium — 3-8 files, some planning needed | dev-cycle.md with plan-feature pre-read |
| `[L]` | Large — feature spanning modules | execute-feature.md |
| `[XL]` | Very large — architecture-affecting | execute-feature.md, requires architect role |
| `[BUG]` | Bug fix | fix-build.md |

---

## Current Sprint

| Size | Task | Status |
|------|------|--------|
| [L] | Camera/image input → SVG conversion pipeline with modal preview | [x] |
| [XL] | CI/CD pipeline (GitHub Actions → Firebase Hosting) | [x] |

---

## Up Next

| Size | Task |
|------|------|
| [S] | Configure `FIREBASE_SERVICE_ACCOUNT` repo secret (base64 service-account key) to replace deprecated `FIREBASE_TOKEN` |
| [S] | Enable `workflows` permission for GitHub App and verify end-to-end push-to-main deploy |
| [M] | Add unit tests for camera-input component |
| [S] | Verify existing tests still pass after changes |

---

## Backlog

| Size | Task |
|------|------|
| [M] | Improve mobile responsiveness for signature pad |
| [S] | Add keyboard shortcut hints to buttons |
| [M] | Performance optimization for large SVGs |
| [M] | Consolidate duplicate build steps in deploy.yml (build artifact reuse) |

---

## Completed This Sprint

| Task | Completed |
|------|-----------|
| Camera/image → SVG pipeline | 2026-07-21 |
| CI/CD deploy.yml + build/env scripts | 2026-08-01 |
| update-ai-system sync | 2026-08-01 |
| Firebase deploy failure diagnosis + workflow hardening | 2026-08-01 |
| Service-account deploy auth (FIREBASE_SERVICE_ACCOUNT) added | 2026-08-01 |

---

## Notes

Initial bootstrap complete. First feature: camera/image-to-SVG pipeline for the signature pad. Second sprint: CI/CD pipeline for automated Firebase Hosting deployment.

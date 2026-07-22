# Development Task Queue

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-07-21
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

---

## Up Next

| Size | Task |
|------|------|
| [M] | Add unit tests for camera-input component |
| [S] | Verify existing tests still pass after changes |
| [M] | Run update-ai-system.md to sync docs with new feature |

---

## Backlog

| Size | Task |
|------|------|
| [M] | Improve mobile responsiveness for signature pad |
| [S] | Add keyboard shortcut hints to buttons |
| [M] | Performance optimization for large SVGs |

---

## Completed This Sprint

| Task | Completed |
|------|-----------|
| — | — |

---

## Notes

Initial bootstrap complete. First feature: camera/image-to-SVG pipeline for the signature pad.

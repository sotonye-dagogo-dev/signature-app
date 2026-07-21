# Project Decisions

> **Metadata**
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-07-21
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Log of significant architectural, technical, and product decisions.

---

## Decisions

## Image-to-SVG Client-Side Conversion Approach

**Decision:** Use canvas-based pixel tracing with embedded SVG fallback for raster-to-SVG conversion
**Date:** 2026-07-21
**Made by:** implementer
**Supersedes:** None
**Superseded by:** None

**Reason:**
The backend API only accepts SVG format for G-code conversion. For raster images (PNG, JPEG, etc.), client-side conversion to SVG is required. The pixel tracing approach generates actual vector paths from pixel data (good for signatures/drawings). An embedded-image SVG fallback is used when the tracing produces insufficient results.

**Alternatives Considered:**
- Server-side conversion: Would require backend changes, additional latency
- Library-based tracing (Potrace): Would add dependency, licensing concerns
- Manual tracing: Impractical for end users

**Implications:**
- Raster images with high detail may produce large SVGs
- Pixel tracing works best for high-contrast images (signatures, drawings)
- Embedded SVGs will work but may not produce optimal G-code

# Test Plan

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-07-21
> - staleness-policy: re-verify if new features are added

> **Overview:** Defines what needs to be tested and at what level.

---

## Unit Tests

- [x] All existing component smoke tests (should create)
- [ ] Signature pad SVG export correctness
- [ ] Form validation rules
- [ ] HMAC signature generation
- [ ] G-code parsing

---

## Integration Tests

- [ ] API route responses (happy path)
- [ ] API route error handling
- [ ] Bluetooth scan/connect/send flow
- [ ] Form submission with HMAC signature

---

## End-to-End Tests

- [ ] Signature draw → download SVG flow
- [ ] Signature draw → convert to G-code → download
- [ ] Signature draw → submit with details → success
- [ ] Camera/image input → SVG → convert flow

---

## Performance Tests

- [ ] Canvas rendering at high DPI
- [ ] Large SVG file handling
- [ ] G-code conversion progress tracking

# Defects Found in the Application Under Test

Both defects below were found by driving the live app with a real browser
(`scripts/probe-error-states.mjs`) before any assertion was written, so the
tests that cover them assert observed behaviour rather than an assumption.

Reproduce the evidence with:

```bash
node scripts/probe-error-states.mjs
```

---

## DEF-001 — A failed products fetch escapes as an unhandled rejection

| Field | Value |
|-------|-------|
| Severity | Medium |
| Area | Product catalog data fetch |
| Found | 2026-07-27 |
| Covered by | `TC-NEG-011` — `tests/negative/api-failure.spec.ts:81` |

**Steps to reproduce**

1. Intercept `**/products.json` and fulfil it with HTTP 500.
2. Load `/products`.

**Expected** — the failure is caught and the user sees an error state or a
retry affordance.

**Actual** — the catalog degrades to `0 Product(s) found`, but the rejection is
never handled and surfaces on `window`:

```json
{
  "label": "http-500",
  "countLabel": "0 Product(s) found",
  "hasSizesHeading": true,
  "cards": 0,
  "pageErrors": ["Request failed with status code 500"]
}
```

**Note** — `TC-NEG-011` currently asserts the rejection *is* observed, so it acts
as a regression guard. When the app adds a rejection handler, invert that
assertion to `toBe(false)`.

---

## DEF-002 — Malformed JSON leaves the catalog stuck with no terminal state

| Field | Value |
|-------|-------|
| Severity | Medium |
| Area | Product catalog data fetch |
| Found | 2026-07-27 |
| Covered by | `TC-NEG-012` — `tests/negative/api-failure.spec.ts:100` |

**Steps to reproduce**

1. Intercept `**/products.json` and fulfil it with `{"products": [` (HTTP 200,
   `content-type: application/json`).
2. Load `/products`.

**Expected** — the parse failure resolves to an error or empty state.

**Actual** — the `N Product(s) found` label never renders at all, so the view
has no terminal state. No page error is raised either, so the failure is
completely silent:

```json
{
  "label": "malformed-json",
  "countLabel": "NONE",
  "hasSizesHeading": true,
  "cards": 0,
  "pageErrors": []
}
```

Contrast with the empty-catalog case (`{"products": []}`), which correctly
renders `0 Product(s) found` with no page errors — covered by `TC-NEG-007`.

---

## DEF-003 — Rapid size-filter toggles silently discard earlier selections

| Field | Value |
|-------|-------|
| Severity | Low (timing-dependent) |
| Area | Size filter |
| Found | 2026-07-27 |
| Covered by | Worked around in `FilterComponent.toggleSize()` |

**Steps to reproduce**

1. Load `/products`.
2. Click size `M`, then click size `S` before the `products.json` refetch
   triggered by the first click has completed.

**Expected** — both filters apply, showing the union (3 products).

**Actual** — only the second filter applies (2 products). The component rebuilds
its selected-size `Set` from the `filters` prop at render time, so a click that
lands before the previous state commits reads a stale `Set`.

Evidence — `scripts/probe-filter.mjs` with a 700 ms settle between clicks
accumulates correctly, proving the logic is right and the failure is a race:

```
initial  label=16 cards=16 visible=16
after +XS   label=1  checked=["XS"]
after +S    label=2  checked=["XS","S"]
after +M    label=3  checked=["XS","S","M"]
after +ML   label=4  checked=["XS","S","M","ML"]
after +L    label=13 checked=["XS","S","M","ML","L"]
after +XL   label=16 checked=["XS","S","M","ML","L","XL"]
after +XXL  label=16 checked=["XS","S","M","ML","L","XL","XXL"]
```

**Framework handling** — `toggleSize()` waits for the `products.json` refetch and
for the rendered card count to stop changing before returning, so this app race
cannot leak into test flakiness.

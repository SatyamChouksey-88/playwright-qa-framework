# Test Plan - React Shopping Cart

**Last verified:** 2026-07-27 - `npx playwright test` -> 57 passed.

## 1. Scope & Objectives

Validate the [Typescript React Shopping Cart](https://react-shopping-cart-67954.firebaseapp.com/products)
SPA for functional correctness, API integrity, cart calculations, filtering,
failure handling, and rendering at scale.

**In scope:** product listing, size filtering, cart add/update/remove,
subtotal and grand total arithmetic, `products.json` contract, network
interception and mocking, large-catalog rendering, API failure states.

**Out of scope:** payment processing (checkout only raises an alert),
accessibility certification, mobile native apps, backend mutation APIs.

## 2. Features Under Test

| Feature | Description |
|---------|-------------|
| Product catalog | 16 products loaded from Firebase JSON on page load |
| Size filter | Client-side filter applied after re-fetching the full catalog |
| Add to cart | Opens the cart drawer; a duplicate SKU increments quantity |
| Cart line items | Name, unit price, quantity, remove control, +/- stepper |
| Totals | Subtotal = sum(price x qty); badge = sum(qty) |
| Checkout | Alert showing the subtotal (smoke coverage only) |

## 3. Coverage by Test Type

| Type | Count | Directory |
|------|-------|-----------|
| Functional | 17 | `tests/functional/` |
| Negative | 14 | `tests/negative/` |
| Boundary / edge | 9 | `tests/boundary/` |
| End-to-end | 6 | `tests/e2e/` |
| API | 7 | `tests/api/` |
| Performance | 4 | `tests/performance/` |
| **Total** | **57** | |

Exploratory coverage is charter-driven and tracked separately in
[`exploratory-charters.md`](./exploratory-charters.md).

## 4. Environments

| Env | URL | Purpose |
|-----|-----|---------|
| prod | Firebase hosted URL | Default CI and assignment target |
| staging | Same host as prod | Proves the environment switch; no separate build exists |
| dev | `http://localhost:3000` | Local clone of the open-source app |

Environment selection and the reasoning behind the dev target are documented in
[`architecture.md`](./architecture.md#environment-status).

## 5. Tools

- Playwright + TypeScript
- Page Object Model with a centralised selector module
- GitHub Actions and Azure DevOps pipelines
- Docker (official Playwright image)

## 6. Entry / Exit Criteria

**Entry:** application reachable; `products.json` returns 200.

**Exit:** all automated tests pass; zero ESLint and TypeScript errors; HTML
report published as a CI artifact.

## 7. Design Decisions

Full rationale lives in [`test-cases.md`](./test-cases.md#design-decisions).
Summarised here because they shape what this plan does and does not cover:

- **DD-01 - no quantity-to-zero path.** The `-` stepper is disabled at quantity
  1, so decrementing to zero is unreachable in the UI. Rather than test a
  non-existent interaction, the contract is covered from both sides: TC-NEG-002
  asserts the guard exists, and TC-CART-003 / TC-NEG-004 assert that removal via
  the delete button empties the line and recalculates totals. If the app ever
  allows decrement-to-zero, TC-NEG-002 fails and flags the change.
- **DD-02 - expected counts are API-derived.** No spec hardcodes "how many
  products should match". Values are computed from the live payload inside the
  test and reconciled against the UI reading.
- **DD-03 - error-state assertions were captured, not assumed.** Failure
  behaviour was probed against the live app before assertions were written.

## 8. Risks & Assumptions

| Risk | Mitigation |
|------|------------|
| SPA timing / flaky loads | Wait for the `products.json` response before asserting |
| Cart drawer blocks UI clicks | Close the cart after each add |
| Price format `$ 10.90` (space) | Numeric parsing strips non-digits |
| Filter re-fetches the full catalog | Assert the request fires with no filter query params |
| Rapid filter clicks drop selections (DEF-003) | `toggleSize()` waits for the refetch and for the card count to settle |
| Substring title collisions | Card and cart-line lookups use exact text matching |
| React re-render detaches nodes mid-read | Catalog is snapshotted in one `evaluateAll` |

## 9. Defects Raised

Three application defects were found during this cycle and are documented with
reproduction evidence in [`defects.md`](./defects.md):

| ID | Summary | Covered by |
|----|---------|------------|
| DEF-001 | A failed products fetch escapes as an unhandled rejection | TC-NEG-011 |
| DEF-002 | Malformed JSON leaves the catalog with no terminal state | TC-NEG-012 |
| DEF-003 | Rapid size-filter toggles silently discard earlier selections | Worked around in `FilterComponent` |

## 10. Traceability Matrix

| Requirement | Test IDs |
|-------------|----------|
| Add all $10.90 / $14.90 products and validate totals | TC-CART-001 |
| Product name, price and quantity validated per line | TC-CART-001, TC-CART-007 |
| Cart price matches the catalog price exactly | TC-CART-001, TC-PROD-003, TC-E2E-002 |
| Individual subtotals, total quantity, grand total | TC-CART-001, TC-CART-005, TC-CART-008, TC-E2E-004 |
| Zero-match mocked scenario | TC-CART-002 |
| Remove line recalculates | TC-CART-003, TC-NEG-004 |
| Duplicate add merges quantity | TC-CART-004, TC-NEG-006 |
| API size vocabulary and contract | TC-API-001 to TC-API-007 |
| Filter network behaviour | TC-E2E-001 |
| Filter then add flow | TC-E2E-002, TC-E2E-003, TC-E2E-005 |
| 100 products visible without blocking the screen | TC-PERF-001 to TC-PERF-004 |
| Zero-product / mocked catalog | TC-NEG-007 to TC-NEG-009 |
| API failure handling | TC-NEG-010 to TC-NEG-013 |
| Empty checkout guard | TC-NEG-001, TC-NEG-009 |
| Stepper disabled at quantity 1 | TC-NEG-002 |
| Boundary prices and quantities | TC-BND-003 to TC-BND-009 |

# Detailed Test Cases

**Last verified:** 2026-07-27 — `npx playwright test` → **57 passed**.

Every case below is automated. Regenerate the inventory with
`npx playwright test --list`.

| Category | Count | Directory |
|----------|-------|-----------|
| Functional | 17 | `tests/functional/` |
| Negative | 14 | `tests/negative/` |
| Boundary / edge | 9 | `tests/boundary/` |
| End-to-end | 6 | `tests/e2e/` |
| API | 7 | `tests/api/` |
| Performance | 4 | `tests/performance/` |
| **Total** | **57** | |

---

## Design decisions

### DD-01 — Emptying a line uses the remove button, never a stepper-to-zero

The `-` stepper is **disabled at quantity 1** (verified in Phase 0 exploration and
asserted by `TC-NEG-002`), so decrementing to zero is not reachable through the
UI. Removing a line is only possible via the delete control
(`[title="remove product from cart"]`).

**Decision:** the framework does not attempt a quantity-to-zero path, because
asserting on an interaction the UI forbids would test a fiction. Instead the
contract is covered from both sides:

- `TC-NEG-002` asserts the stepper is disabled at quantity 1 — the guard exists.
- `TC-CART-003` and `TC-NEG-004` assert removal via the delete button empties the
  line and recalculates totals — the supported path works.

If the app ever enables decrement-to-zero, `TC-NEG-002` fails first and flags the
behaviour change.

### DD-02 — Expected counts are derived from the API, never hardcoded

No spec asserts a bare literal for "how many products should match". Expected
values are computed from the live `products.json` payload inside the test and the
UI reading is reconciled against it (for example
`tests/functional/cart-price-validation.spec.ts:20`). A data change therefore
moves both sides together instead of producing a false failure, while a genuine
UI/API divergence still fails.

### DD-03 — Error-state assertions were captured from the app, not assumed

`scripts/probe-error-states.mjs` was run against the live app first; the negative
specs assert what was actually observed. Two application defects surfaced this
way and are recorded in [`defects.md`](./defects.md).

---

## Functional (17)

| TC ID | Title | Priority | Expected Result | Spec |
|-------|-------|----------|-----------------|------|
| TC-CART-001 | Add all $10.90/$14.90 products and validate totals | P0 | Match count equals the API-derived count; every line's name, unit price, quantity and subtotal correct; grand total reconciles | `functional/cart-price-validation.spec.ts:12` |
| TC-CART-002 | Zero price matches with a mocked catalog | P1 | Catalog non-empty, zero matches, cart quantity 0, total $0 | `functional/cart-price-validation.spec.ts:65` |
| TC-CART-003 | Removing a line recalculates totals | P1 | Line gone; quantity and total both 0 | `functional/cart-price-validation.spec.ts:87` |
| TC-CART-004 | Duplicate add increments quantity | P1 | One line at quantity 2; subtotal doubles | `functional/cart-price-validation.spec.ts:106` |
| TC-CART-005 | Increasing quantity updates line and grand total | P1 | Quantity 2; grand total equals unit price × 2 | `functional/cart-quantity.spec.ts:9` |
| TC-CART-006 | Decrease after increase restores original state | P1 | Quantity back to 1; total back to unit price | `functional/cart-quantity.spec.ts:26` |
| TC-CART-007 | Distinct products create separate lines | P1 | Three products produce three lines, each quantity 1 | `functional/cart-quantity.spec.ts:43` |
| TC-CART-008 | Badge equals the sum of line quantities | P1 | Badge shows 3 for 2×A + 1×B | `functional/cart-quantity.spec.ts:64` |
| TC-CART-009 | Checkout alert matches the cart footer subtotal | P2 | Alert amount equals footer grand total | `functional/cart-quantity.spec.ts:83` |
| TC-PROD-001 | Card count equals label and API length | P0 | All three agree | `functional/product-catalog.spec.ts:5` |
| TC-PROD-002 | Every API title renders in the catalog | P0 | No product missing from the grid | `functional/product-catalog.spec.ts:16` |
| TC-PROD-003 | Displayed price matches API price per product | P0 | Values equal and formatted `$N.NN` | `functional/product-catalog.spec.ts:32` |
| TC-PROD-004 | Free shipping badge tracks `isFreeShipping` | P2 | Badge present iff the flag is true | `functional/product-catalog.spec.ts:50` |
| TC-PROD-005 | Installment text tracks `installments` | P3 | `or N x` shown iff `installments > 0`, N matches | `functional/product-catalog.spec.ts:66` |
| TC-FILTER-001 | One size shows exactly the API-matching products | P1 | Count equals API-derived count for that size | `functional/size-filter.spec.ts:4` |
| TC-FILTER-002 | Two sizes combine as a union, not an intersection | P1 | Count equals union and exceeds intersection | `functional/size-filter.spec.ts:21` |
| TC-FILTER-003 | Unchecking the last size restores the catalog | P2 | Count returns to the full catalog length | `functional/size-filter.spec.ts:44` |

## Negative (14)

| TC ID | Title | Priority | Expected Result | Spec |
|-------|-------|----------|-----------------|------|
| TC-NEG-001 | Checkout with an empty cart | P2 | Alert asks the user to add products | `negative/cart-negative.spec.ts:8` |
| TC-NEG-002 | Decrease disabled at quantity 1 | P2 | `-` button disabled (see DD-01) | `negative/cart-negative.spec.ts:23` |
| TC-NEG-003 | Fresh session starts empty | P2 | Badge reads 0 | `negative/cart-negative.spec.ts:35` |
| TC-NEG-004 | Remove then re-add the only line | P1 | Cart empties, then accepts the product again | `negative/cart-negative.spec.ts:39` |
| TC-NEG-005 | Closing the drawer preserves contents | P2 | Line intact at quantity 1 after reopen | `negative/cart-negative.spec.ts:53` |
| TC-NEG-006 | Repeated adds never duplicate a line | P1 | One line at quantity 3 | `negative/cart-negative.spec.ts:69` |
| TC-NEG-007 | Empty catalog `{ products: [] }` | P1 | `0 Product(s) found`, zero cards, zero page errors | `negative/api-failure.spec.ts:16` |
| TC-NEG-008 | Empty catalog keeps the filter usable | P2 | Seven checkboxes render; filtering still reports 0 | `negative/api-failure.spec.ts:31` |
| TC-NEG-009 | Empty catalog keeps checkout guarded | P2 | Cart 0; checkout still shows the guidance alert | `negative/api-failure.spec.ts:46` |
| TC-NEG-010 | HTTP 500 degrades without blanking the page | P1 | Shell and filter render; 0 products | `negative/api-failure.spec.ts:69` |
| TC-NEG-011 | **DEF-001** HTTP 500 unhandled rejection | P1 | Rejection observed on `window` (regression guard) | `negative/api-failure.spec.ts:81` |
| TC-NEG-012 | **DEF-002** malformed JSON has no terminal state | P1 | Count label never renders; zero cards | `negative/api-failure.spec.ts:100` |
| TC-NEG-013 | Slow response still renders | P2 | 3 s delayed payload renders in full | `negative/api-failure.spec.ts:115` |
| TC-NEG-014 | Filter matching no product | P2 | Count settles at 0 | `negative/api-failure.spec.ts:128` |

## Boundary / edge (9)

| TC ID | Title | Priority | Expected Result | Spec |
|-------|-------|----------|-----------------|------|
| TC-BND-001 | Price matches reconcile with the API | P1 | UI and API counts agree per target price | `boundary/price-filter-boundary.spec.ts:7` |
| TC-BND-002 | Toggle filter changes then restores count | P2 | Count drops to the API-derived value, then returns | `boundary/price-filter-boundary.spec.ts:33` |
| TC-BND-003 | Single-product catalog | P2 | One card; add works; total equals its price | `boundary/catalog-boundary.spec.ts:9` |
| TC-BND-004 | Highest-priced item ($134.90) | P2 | Unit price and total exact | `boundary/catalog-boundary.spec.ts:26` |
| TC-BND-005 | Lowest-priced item ($9.00) | P2 | Unit price and total exact | `boundary/catalog-boundary.spec.ts:42` |
| TC-BND-006 | All seven sizes selected | P2 | Count equals the full union (16) | `boundary/catalog-boundary.spec.ts:58` |
| TC-BND-007 | Quantity raised to 10 | P1 | Quantity 10; total precise to the cent | `boundary/catalog-boundary.spec.ts:76` |
| TC-BND-008 | Minimum boundary price ($0.01) | P3 | Renders and totals without rounding loss | `boundary/catalog-boundary.spec.ts:100` |
| TC-BND-009 | Maximum boundary price ($999,999.99) | P3 | Renders and totals without truncation | `boundary/catalog-boundary.spec.ts:123` |

## End-to-end (6)

| TC ID | Title | Priority | Expected Result | Spec |
|-------|-------|----------|-----------------|------|
| TC-E2E-001 | Filter triggers refetch without query params | P1 | One `products.json` request; no `size=`/`filter=` | `e2e/filter-and-cart-flow.spec.ts:7` |
| TC-E2E-002 | Filter, add matching product, validate cart | P0 | UI match count equals API-derived count; line correct | `e2e/filter-and-cart-flow.spec.ts:29` |
| TC-E2E-003 | Filter, add, remove, end empty | P1 | Quantity and total return to 0 | `e2e/shopping-journey.spec.ts:10` |
| TC-E2E-004 | Multi-product journey with quantity change | P0 | Full cart math reconciles | `e2e/shopping-journey.spec.ts:31` |
| TC-E2E-005 | Filter, add, clear filter, add again | P1 | Two lines survive the filter change; total correct | `e2e/shopping-journey.spec.ts:60` |
| TC-E2E-006 | Complete purchase journey to checkout | P0 | Alert confirms the same total shown in the cart | `e2e/shopping-journey.spec.ts:96` |

## API (7)

| TC ID | Title | Priority | Expected Result | Spec |
|-------|-------|----------|-----------------|------|
| TC-API-001 | Valid abbreviated size codes | P0 | Every size is in `S/XS/M/ML/L/XL/XXL/X`; no spelled-out words | `api/products-api.spec.ts:9` |
| TC-API-002 | API sizes align with UI checkboxes | P1 | No size outside the allowed vocabulary | `api/products-api.spec.ts:21` |
| TC-API-003 | Each UI filter size exists on a product | P1 | No filter checkbox is dead | `api/products-api.spec.ts:49` |
| TC-API-004 | Payload contract per product | P0 | All UI-consumed fields present and correctly typed | `api/products-schema.spec.ts:5` |
| TC-API-005 | `id` and `sku` are unique | P1 | No duplicates across the catalog | `api/products-schema.spec.ts:26` |
| TC-API-006 | Prices positive, installments non-negative | P1 | No zero/negative prices | `api/products-schema.spec.ts:38` |
| TC-API-007 | Endpoint responds 200 JSON within budget | P1 | 200, JSON content type, under 5 s | `api/products-schema.spec.ts:51` |

## Performance (4)

| TC ID | Title | Priority | Expected Result | Spec |
|-------|-------|----------|-----------------|------|
| TC-PERF-001 | 100 mocked products render | P1 | 100 cards and label; zero page errors | `performance/large-catalog-render.spec.ts:16` |
| TC-PERF-002 | First product interactive within budget | P1 | Add-to-cart usable and cart opens under 15 s | `performance/large-catalog-render.spec.ts:36` |
| TC-PERF-003 | All 100 cards have title and parsable price | P1 | No blank or unparsable card | `performance/large-catalog-render.spec.ts:59` |
| TC-PERF-004 | Filtering 100 products within budget | P2 | Settles on the expected count under 15 s | `performance/large-catalog-render.spec.ts:81` |

The 100-product payload is committed static data at
`test-data/mock-products-100.json`, regenerated only on demand via
`npm run data:generate`.

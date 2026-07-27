# MCP & AI-Agent Workflow

## Session Context

**Date:** 2026-07-27  
**Playwright MCP:** Not connected in this session — exploration used terminal Playwright script + GitHub source review.

## Phase 0 Findings vs. Brief Assumptions

| Topic | Brief assumed | Actual finding |
|-------|---------------|----------------|
| Product API | JSON on page load | `GET firebaseio.com/products.json` — confirmed |
| Filter behavior | Unclear | Re-fetches full JSON; filters client-side (no query params) |
| data-testid | Checkbox confirmed | Only checkboxes have test ids — no ids on cart/products |
| Price format | `$10.90` | Cart uses `$ 10.90` (space after `$`) |
| Quantity → 0 | Stepper to zero | Minus disabled at qty 1; delete button removes line |
| Checkout | May not exist | Exists — shows JavaScript alert only |

## How Assignment Notes Were Implemented

| Original note | Implementation |
|---------------|----------------|
| Filtering/chaining | `productCard.filter({ hasText })` + chained child locators |
| XPath | `priceInCardByTitle()` in ProductsPage with comment |
| Looping | `locator.all()` / indexed loops with `test.step()` |
| API + sizes | `products-api.spec.ts` + `ProductsApiClient` |
| 100 products / mocking | `large-catalog-render.spec.ts` with `page.route()` + committed `test-data/mock-products-100.json` |
| Read filter request | `TC-E2E-001` monitors network before/after filter toggle |

## Seeded-Failure Exercise

### Bug injected

Changed cart price regex from `/\$\s*(\d+\.\d{2})/g` to `/\$(\d+\.\d{2})/g` (no optional space).

### Failure observed

```
TC-CART-001 › Validate line item: Cropped Stay Groovy off white
expect(pricesEqual(line.unitPrice, expected.unitPrice)).toBeTruthy()
Received: false
```

### Root cause (from trace + snapshot)

Cart line snapshot showed price as `$ 10.90` (paragraph ref=e223). Strict regex `\$(\d+...)` failed to match because of the space between `$` and digits. Parser returned `unitPrice = 0`.

Screenshot in `test-results/` showed cart drawer with correct visual price — failure was purely a parsing bug, not an application bug.

### Fix

Updated regex to `/\$\s*(\d+\.\d{2})/g` in `cart.component.ts` and catalog parser in `products.page.ts`.

### Maintenance takeaway

Re-run Phase 0 exploration when the app updates price formatting, and prefer numeric parsing (`replace(/[^0-9.]/g)`) over display-string regex when possible.

## Ongoing AI-Assisted Maintenance

1. **Selector drift:** Periodically run `scripts/explore.mjs` and diff against `exploration-notes.md`
2. **New features:** Use MCP browser tools (when connected) to record locators before coding
3. **Failure triage:** Playwright trace + HTML report first; update page objects, not specs

---

# 2026-07-27 - Live MCP attempt and the fallback actually used

## 1. MCP availability check (literal calls and results)

The MCP config in place during this session declared the server as follows. It
lived at `.cursor/mcp.json`, which was removed when the project was packaged for
handoff — `.cursor/` is local editor config, not part of the framework. Recreate
it to reproduce this setup:

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
  }
}
```

The package resolves from this machine:

```console
$ npx -y @playwright/mcp@latest --version
Version 0.0.78
```

But no MCP server is registered with the agent runtime for this session. Tool
discovery returned an empty catalog both times it was called:

```jsonc
// call: GetMcpTools {}
{ "mode": "catalog", "servers": [] }

// call: GetMcpTools { "pattern": ".*" }
{ "mode": "search", "pattern": ".*", "matches": [] }
```

**Conclusion:** the config is correct and the binary is installed, but the server
is not enabled in the IDE for this session, so zero `browser_*` tools were
callable. No MCP tool transcript is fabricated below.

## 2. What was done instead - agent-driven browser investigation

The same investigative loop was executed with a directly driven Chromium
instance. Two committed probe scripts stand in for the MCP browser tools, and
both produced findings that changed the test code.

### Probe A - `scripts/probe-error-states.mjs` (equivalent of `browser_navigate` + `browser_snapshot`)

Question: what does the app actually do when `products.json` fails? The negative
specs were about to be written against an assumption.

```console
$ node scripts/probe-error-states.mjs
{
  "label": "empty-catalog",
  "countLabel": "0 Product(s) found",
  "hasSizesHeading": true,
  "cards": 0,
  "pageErrors": []
}
{
  "label": "http-500",
  "countLabel": "0 Product(s) found",
  "hasSizesHeading": true,
  "cards": 0,
  "pageErrors": ["Request failed with status code 500"]
}
{
  "label": "malformed-json",
  "countLabel": "NONE",
  "hasSizesHeading": true,
  "cards": 0,
  "pageErrors": []
}
```

**Outcome:** two application defects (DEF-001, DEF-002 in
[`defects.md`](./defects.md)) and eight negative tests written against observed
behaviour rather than a guess.

### Probe B - `scripts/probe-filter.mjs` (equivalent of `browser_click` + `browser_snapshot`)

Question: `TC-FILTER-002` expected a union of 3 products for sizes M+S but the UI
reported 2. Is the expectation wrong, or the app?

```console
$ node scripts/probe-filter.mjs
initial  label=16 cards=16 visible=16
after +XS   label=1  cards=1  checked=["XS"]
after +S    label=2  cards=2  checked=["XS","S"]
after +M    label=3  cards=3  checked=["XS","S","M"]
after +ML   label=4  cards=4  checked=["XS","S","M","ML"]
after +L    label=13 cards=13 checked=["XS","S","M","ML","L"]
after +XL   label=16 cards=16 checked=["XS","S","M","ML","L","XL"]
after +XXL  label=16 cards=16 checked=["XS","S","M","ML","L","XL","XXL"]
```

**Outcome:** with a 700 ms settle between clicks the filters accumulate perfectly,
so the expectation was right and the failure was a race. Root cause: the app
rebuilds its selected-size `Set` from the `filters` prop at render time, so a
click landing before the previous refetch commits reads a stale `Set` and drops
the earlier selection (DEF-003). Fixed in `FilterComponent.toggleSize()`, which
now waits for the refetch and for the card count to stop changing.

## 3. Real failure investigation this round

Six tests failed on the first full run of the expanded suite. Triage used the
Playwright artifacts, not guesswork - `test-results/*/error-context.md` carries
the failure plus a full ARIA snapshot of the page at failure time.

```console
$ Get-ChildItem test-results -Directory | ForEach-Object { ... error-context.md }
Error: locator.click: Error: strict mode violation:
  locator('div[tabindex="1"]')...filter({ hasText: 'Blue T-Shirt' })
  resolved to 2 elements
```

**Root cause:** Playwright's `hasText` is a *case-insensitive substring* match, so
`'Blue T-Shirt'` also matched the "Marine Blue T-shirt" card. Fixed by switching
card and cart-line lookups to `{ has: getByText(title, { exact: true }) }`.

A second cluster (`locator.innerText: Timeout ... nth(4)`) traced to
`getAllCatalogProducts()` re-resolving the card locator per index while React was
re-rendering the grid. Fixed by snapshotting all cards in one `evaluateAll`.

Result: 57/57 passing.

## 4. If the MCP server is enabled later

Turn the server on in Cursor's MCP settings, then this workflow replaces the
probe scripts one-for-one:

| Probe step | MCP equivalent |
|------------|----------------|
| `page.goto` in probe script | `browser_navigate` |
| `page.evaluate(() => document.body.innerText)` | `browser_snapshot` |
| `page.getByText(size).click()` | `browser_click` |
| `page.on('pageerror')` collection | `browser_console_messages` |
| `page.route(...)` mocking | `browser_network_requests` for inspection |

The probe scripts remain committed either way: they are reproducible by anyone
reviewing this repo without needing an MCP-capable client.

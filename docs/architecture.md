# Framework Architecture

## Overview

Enterprise Playwright framework for the React Shopping Cart SPA, organized into strict layers with dependency flow: **Tests → Fixtures → Pages → Utils/Config → External Data**.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   tests/    │────▶│  fixtures/   │────▶│   pages/    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                                        │
       ▼                                        ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ test-data/  │     │   config/    │     │   utils/    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────────────┐
                    │    api/      │
                    └──────────────┘
```

## Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Tests | `tests/` | Orchestration and assertions only — no selectors |
| Fixtures | `src/fixtures/` | Inject page objects + API client |
| Pages | `src/pages/` | Locators as `readonly` properties; user actions |
| Selectors | `src/pages/selectors.ts` | Single home for every raw selector shared by 2+ page objects |
| API | `src/api/` | Direct REST calls via Playwright `request` |
| Utils | `src/utils/` | Pure helpers (currency, network, mocks, logging) |
| Config | `config/` | Environment resolution (dev/staging/prod) |
| Data | `test-data/` | JSON literals — prices, boundaries, API snapshots |

## Filter Behavior

Documented finding from Phase 0 (see `exploration-notes.md`):

1. **Page load:** `GET https://react-shopping-cart-67954.firebaseio.com/products.json`
2. **Size filter toggle:** Triggers **another** full `GET products.json` — no filter query parameters
3. **Filtering logic:** Client-side after re-fetch — `products.filter(p => selectedSizes.some(s => p.availableSizes.includes(s)))`

Tests in `filter-and-cart-flow.spec.ts` assert the network re-fetch without encoded filter params.

## Locator Strategy

Priority order:
1. `data-testid` (size checkboxes — confirmed)
2. ARIA role + name (`button: Add to cart`, `Checkout`)
3. Text / title attributes
4. XPath (documented in `products.page.ts` for price-within-card)

**Centralised selectors.** Every raw selector needed by more than one page object
lives in `src/pages/selectors.ts`. No spec file contains a selector, and no
selector string is repeated across files.

**Exact text, not substring.** Card and cart-line lookups match title text with
`{ exact: true }`. Playwright's `hasText` does a *case-insensitive substring*
match, which made `productCardByTitle('Blue T-Shirt')` also select the
"Marine Blue T-shirt" card and produced strict-mode violations. See
`src/pages/products.page.ts` and `src/pages/cart.component.ts`.

**Race-free reads.** `getAllCatalogProducts()` snapshots every card in a single
`evaluateAll` rather than iterating `nth(i)`, because per-index resolution races
React re-rendering the grid after a filter change and intermittently throws on a
detached node.

## Reporting

- **Local:** HTML report in `playwright-report/`
- **CI:** Blob reporter per shard → `merge-reports` → combined HTML artifact
- **Azure:** JUnit XML + HTML artifact

## CI/CD

- GitHub Actions: matrix sharding (2 shards), artifact upload
- Azure Pipelines: single-runner equivalent with JUnit publish
- Docker: `mcr.microsoft.com/playwright:v1.62.0-jammy` — the tag is pinned to the
  exact `@playwright/test` version in `package.json`. A drift between the two
  means the image's preinstalled browsers no longer match the client, so
  `@playwright/test` is pinned exactly rather than with a `^` range.

## Multi-Environment

| Variable | Purpose |
|----------|---------|
| `TEST_ENV` | Selects `dev` / `staging` / `prod` env file |
| `BASE_URL` | Override application URL |
| `PRODUCTS_API_URL` | Override products API endpoint |

### Environment status

| Env | Target | Status |
|-----|--------|--------|
| `prod` | `https://react-shopping-cart-67954.firebaseapp.com` | **Active** — the full suite runs here |
| `staging` | Same Firebase host | **Active as an alias** — the app has no separate staging deployment, so this exists to prove the switch works, not to test a distinct build |
| `dev` | `http://localhost:3000` | See below |

**Dev environment decision.** The upstream app
(`github.com/jeffersonRibeiro/react-shopping-cart`) is cloned to
`../react-shopping-cart` and `config/environments/dev.env` points `BASE_URL` at
`http://localhost:3000`. Running against dev is therefore:

```bash
cd ../react-shopping-cart && npm start     # terminal 1
npm run test:dev                           # terminal 2
```

The dev target is **not exercised in CI**, deliberately: CI would have to build
and boot a second application on every run for no additional coverage, since dev
serves the same code as prod against the same Firebase API. The wiring is
verified manually and the suite's environment switch is proven by `staging`.
This is a scope decision, not an unfinished item.

## Extension Points

Adding a new feature test:
1. Create page/component object in `src/pages/`
2. Register in `src/fixtures/test-fixtures.ts`
3. Add test data JSON if needed
4. Create spec under appropriate `tests/` subdirectory

No changes required to existing specs or utilities.

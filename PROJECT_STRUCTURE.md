# Project structure

A Playwright test suite for a public demo web app — the [Typescript React
Shopping Cart](https://react-shopping-cart-67954.firebaseapp.com/products). There
is no application source code in here. The app is somebody else's, deployed on
Firebase, and this repo only tests it over the network.

57 tests across six categories. If you want to run them, read `HOW_TO_RUN.txt`
instead — this file is about where things live and why.

## Where to look first

| You want | Go to |
|----------|-------|
| The main assignment (Task 1: add all $10.90/$14.90 products, verify cart math) | `tests/functional/cart-price-validation.spec.ts` |
| The test plan | `docs/test-plan.md` |
| All 57 test cases, with IDs, and the design decisions behind them | `docs/test-cases.md` |
| How the framework is layered and why | `docs/architecture.md` |
| CI pipelines | `.github/workflows/playwright.yml`, `azure-pipelines.yml` |
| Test data (prices, boundary values, the 100-product mock) | `test-data/` |
| Bugs found in the app under test | `docs/defects.md` |
| How AI agents and Playwright MCP were used | `docs/mcp-ai-workflow.md` |

Two abbreviations you'll hit repeatedly:

- **POM — Page Object Model.** UI selectors and interactions live in classes
  under `src/pages/`, never in the test files. A test says
  `cart.getGrandTotal()`; it does not know what the cart's DOM looks like. When
  the app's markup changes you edit one page object instead of twenty specs.
- **MCP — Model Context Protocol.** A standard that lets an AI agent call
  external tools. Playwright ships an MCP server that exposes browser control
  (navigate, click, snapshot) to an agent. `docs/mcp-ai-workflow.md` records how
  that was used here, including where it wasn't available and what stood in.

## The tree

Generated with `node scripts/print-tree.mjs` (Windows `tree /F /A` and
Unix `tree -I node_modules` produce the same thing in a different style).
`node_modules/` and generated report folders are excluded.

```
playwright-qa-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── .husky/
│   ├── _/                          (husky's own generated shims)
│   └── pre-commit
├── config/
│   ├── environments/
│   │   ├── dev.env
│   │   ├── prod.env
│   │   └── staging.env
│   └── env.ts
├── docker/
│   └── Dockerfile
├── docs/
│   ├── demo/
│   │   ├── 01-suite-run.png
│   │   ├── 02-html-report-overview.png
│   │   ├── 03-html-report-test-detail.png
│   │   ├── 04-folder-structure.png
│   │   ├── folder-structure.txt
│   │   ├── README.md
│   │   └── suite-run.txt
│   ├── architecture.md
│   ├── defects.md
│   ├── exploration-notes.md
│   ├── exploratory-charters.md
│   ├── failure-analysis-example.md
│   ├── mcp-ai-workflow.md
│   ├── test-cases.md
│   └── test-plan.md
├── scripts/
│   ├── capture-demo.mjs
│   ├── check-encoding.mjs
│   ├── explore.mjs
│   ├── generate-mock-products.mjs
│   ├── print-tree.mjs
│   ├── probe-error-states.mjs
│   └── probe-filter.mjs
├── src/
│   ├── api/
│   │   └── products.api-client.ts
│   ├── fixtures/
│   │   └── test-fixtures.ts
│   ├── pages/
│   │   ├── base.page.ts
│   │   ├── cart.component.ts
│   │   ├── filter.component.ts
│   │   ├── products.page.ts
│   │   └── selectors.ts
│   ├── types/
│   │   └── product.types.ts
│   └── utils/
│       ├── api-mock.util.ts
│       ├── currency.util.ts
│       ├── logger.util.ts
│       ├── mock-data.generator.ts
│       ├── network.util.ts
│       ├── retry.util.ts
│       └── size-codes.util.ts
├── test-data/
│   ├── api-snapshots/
│   │   └── products-response.sample.json
│   ├── boundary-values.json
│   ├── mock-products-100.json
│   ├── price-filters.json
│   └── size-codes.json
├── tests/
│   ├── api/
│   │   ├── products-api.spec.ts
│   │   └── products-schema.spec.ts
│   ├── boundary/
│   │   ├── catalog-boundary.spec.ts
│   │   └── price-filter-boundary.spec.ts
│   ├── e2e/
│   │   ├── filter-and-cart-flow.spec.ts
│   │   └── shopping-journey.spec.ts
│   ├── functional/
│   │   ├── cart-price-validation.spec.ts
│   │   ├── cart-quantity.spec.ts
│   │   ├── product-catalog.spec.ts
│   │   └── size-filter.spec.ts
│   ├── negative/
│   │   ├── api-failure.spec.ts
│   │   └── cart-negative.spec.ts
│   └── performance/
│       └── large-catalog-render.spec.ts
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── azure-pipelines.yml
├── HOW_TO_RUN.txt
├── package-lock.json
├── package.json
├── playwright.config.ts
├── PROJECT_STRUCTURE.md
├── README.md
└── tsconfig.json
```

Three folders you won't see above because they're generated and git-ignored:
`node_modules/`, `playwright-report/` (the HTML report), and `test-results/`
(traces, videos and screenshots kept only for failures).

## tests/ — the specs

Split by category, which is also how you run a subset (`npm run test:negative`
maps to `tests/negative/`). Counts as of the last verified run:

| Folder | Tests | What's in it |
|--------|-------|--------------|
| `functional/` | 17 | The main flows. `cart-price-validation.spec.ts` is Task 1. The other three cover quantity steppers, catalog-vs-API rendering, and size filtering. |
| `negative/` | 14 | Empty cart, disabled controls, and — the interesting half — what happens when the products API returns 500, malformed JSON, an empty array, or responds slowly. |
| `boundary/` | 9 | Price and catalog extremes: cheapest and dearest real products, a one-product catalog, $0.01, $999,999.99, quantity 10, all seven size filters at once. |
| `e2e/` | 6 | Journeys that cross features — filter, add, change quantity, remove, check out. |
| `api/` | 7 | `products.json` directly, no browser. Size-code vocabulary, payload contract, unique IDs, response time. |
| `performance/` | 4 | 100 mocked products. Does the grid render, stay interactive, and filter within budget. |

Test IDs (`TC-CART-001`, `TC-NEG-011`, and so on) appear in the test titles and
match rows in `docs/test-cases.md`. That's the traceability link — pick any line
in a run log and you can find its documented case.

Specs contain no selectors. That's enforced by convention rather than tooling, so
if you add one, grep `tests/` for `page.locator(` before you commit — it should
come back empty.

## src/ — everything the specs lean on

`pages/` holds the page objects. `products.page.ts` and `cart.component.ts` are
the two you'll touch most; `filter.component.ts` is small but carries the
trickiest logic in the repo, because the app drops filter selections if you click
two size checkboxes faster than its refetch completes. `toggleSize()` waits that
out. `selectors.ts` is a single map of the raw CSS selectors used by more than
one page object — the app under test has almost no `data-testid` attributes, so
the few structural selectors we depend on are collected in one place rather than
scattered.

`fixtures/test-fixtures.ts` is the injection point. It extends Playwright's
`test` object so a spec can ask for `{ productsPage, cart, filter, productsApi }`
in its arguments and get them already constructed.

`api/products.api-client.ts` calls the products endpoint directly through
Playwright's `request` fixture. It matters more than it looks: most specs read
expected values from the API and then check the UI against them, rather than
hardcoding counts.

`utils/` is small helpers. `currency.util.ts` exists because the app renders
prices as `$ 10.90` with a space in some places and `$10.90` in others, and a
naive regex silently returns zero. `api-mock.util.ts` centralises route
interception and holds the guard that skips mock-based tests when the target
environment doesn't fetch over the network. `size-codes.util.ts` validates that
the API uses abbreviated size codes (`S`, `XS`, `ML`, …) and never spelled-out
words.

## config/ — which environment, and what that implies

`env.ts` resolves `TEST_ENV` (default `prod`) into a base URL, a products API
URL, and a flag called `fetchesCatalogOverNetwork`. That last one is not
bureaucracy. The app's own `getProducts()` branches on `NODE_ENV`: the deployed
build calls Firebase, but a locally-run development build imports a bundled JSON
file and makes no request at all. So on `dev` there is nothing for `page.route()`
to intercept, and 17 tests skip themselves with that reason printed rather than
failing for a misleading cause.

`environments/*.env` supply the URLs. `staging` currently points at the same host
as `prod` because the app has no separate staging deployment — it proves the
switch works, it doesn't test a different build.

## test-data/ — externalised values

Nothing in the specs hardcodes a price or a threshold.

- `price-filters.json` — the `$10.90` / `$14.90` targets for Task 1, plus the
  expected display strings, which catch a formatting regression that numeric
  comparison would miss.
- `boundary-values.json` — edge prices, a high quantity, timeout budgets, and a
  catalog-size floor. Deliberately a floor, not an exact count: the upstream
  catalog is not ours and may grow.
- `size-codes.json` — the seven size codes the UI filter offers and the full set
  the API is allowed to return (which includes a legacy `X`).
- `mock-products-100.json` — a committed 100-product payload for the performance
  tests. Regenerate with `npm run data:generate` if the upstream shape changes.
  It clones real products and keeps their original `sku` values, because the app
  builds image paths from the SKU and an invented one crashes its bundle.
- `api-snapshots/` — one captured real response, for reference when reading the
  types.

## docs/

`test-plan.md` and `test-cases.md` are the two graded documents; `test-cases.md`
also carries the design decisions (DD-01 through DD-03) explaining why certain
things are tested the way they are — most usefully, why nothing tries to
decrement a cart quantity to zero.

`architecture.md` covers layering and the locator strategy, including two
Playwright gotchas that caused real failures here: `hasText` matches substrings
case-insensitively (so "Blue T-Shirt" also matched "Marine Blue T-shirt"), and
iterating a locator with `nth(i)` races React re-rendering the grid.

`defects.md` is three defects found in the app itself, each with the output that
reproduces it.

`mcp-ai-workflow.md` and `failure-analysis-example.md` document the AI-assisted
side of the work — how agents were used to explore the app, generate and refine
scenarios, and triage failures, and equally where MCP was unavailable and what
was done instead. Both are required deliverables; they're honest about what was
and wasn't possible.

`demo/` is an annotated walkthrough with real screenshots and the captured run
log, for presenting the project without needing to run it live.

## scripts/ — standalone diagnostics

None of these run as part of the test suite. They're `.mjs` so they execute with
plain `node`, no build step.

`probe-error-states.mjs` and `probe-filter.mjs` are the two worth knowing about.
They drive a real browser to answer a question before assertions get written —
"what does this app actually do when the API 500s?" Both found real bugs.
`generate-mock-products.mjs` rebuilds the 100-product fixture.
`check-encoding.mjs` runs as part of `npm run validate` and fails the build if
any text file contains mojibake, which happened twice when docs were written
through a PowerShell pipeline that re-encoded UTF-8 punctuation.
`capture-demo.mjs` regenerates the screenshots in `docs/demo/`.
`print-tree.mjs` regenerates the tree in this file. `explore.mjs` is the original
exploration script from the first pass over the app.

## Root files

| File | What it does |
|------|--------------|
| `playwright.config.ts` | Test directory, 90 s timeout, parallelism, retries, reporters, and `baseURL` pulled from `config/env.ts`. Only a `chromium` project is defined — this suite is single-browser. |
| `package.json` | Scripts (including per-category and per-environment runs) and pinned dependencies. `@playwright/test` is pinned exactly, not with a `^` range, so it can't drift from the Docker image tag. |
| `tsconfig.json` | Type checking only; `npm run typecheck` never emits output. |
| `.eslintrc.cjs` | Uses the older eslintrc format. The `lint` script sets `ESLINT_USE_FLAT_CONFIG=false` for that reason, which is why ESLint prints a deprecation notice on every run. Harmless, but that's the explanation. |
| `.husky/pre-commit` | Runs `npm run validate` (typecheck, lint, encoding check) before every commit. |
| `.env.example` | Copy to `.env` for local overrides. `.env` itself is git-ignored. |
| `docker/Dockerfile` | Runs the suite in the official Playwright image. The tag must match the `@playwright/test` version in `package.json` or the preinstalled browsers won't match the client. |

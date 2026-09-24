# Design decisions

This document explains *why* the framework is shaped the way it is. Interviewers
should not have to reverse-engineer intent from folder names alone.

## Fixtures over `beforeEach`

Page objects and the API client are injected via `src/fixtures/test-fixtures.ts`
rather than constructed in every `beforeEach`.

- Specs stay orchestration + assertions; setup noise stays out of the test body.
- Each fixture is created once per test with the correct Playwright `page` /
  `request` fixture — no shared mutable page-object state across tests.
- Extending the suite (new page, new API client) is one fixture entry, not a
  copy-paste edit across dozens of files.

## Locator strategy

Priority order used throughout the page objects:

1. **`data-testid`** when the app exposes one (size checkboxes).
2. **Role + accessible name** (`getByRole('button', { name: 'Add to cart' })`).
3. **Exact text / title attributes** for cart badge and remove controls.
4. **Scoped structural selectors** only when the DOM has no better hook
   (`div[tabindex="1"]` for product cards — the app’s only stable card root).
5. **Narrow XPath** only for price-within-card and cart-line parent traversal,
   documented in the page object. The demo app does not expose price
   `data-testid`s; inventing brittle CSS chains would be worse.

Exact-text matching (`{ exact: true }`) is mandatory for product titles.
Playwright’s `hasText` is a case-insensitive substring match, so
`"Blue T-Shirt"` would also select `"Marine Blue T-shirt"` and trigger
strict-mode violations.

## Flakiness handling

| Control | Choice | Why |
|---|---|---|
| Auto-waiting | Prefer web-first assertions / `expect.poll` | No `waitForTimeout` in tests or page objects |
| Retries | `2` in CI only, `0` locally | Masks infrastructure flakes in CI; forces local investigation |
| Trace | `on-first-retry` | Useful debug artifact without storing every green run |
| Catalog reads | `evaluateAll` snapshot of cards | Avoids `nth(i)` races against React re-renders after filter |
| Network | Assert `products.json` responses where relevant | Filter is client-side after a full re-fetch (see architecture notes) |

## What was deliberately NOT automated

- **Checkout payment / order confirmation** — the public demo cart has no real
  payment flow worth owning as a regression suite.
- **Visual regression screenshots across browsers** — out of scope for this
  portfolio slice; would need stable font/OS baselines and a dedicated workflow.
- **Auth flows** — the demo SPA is unauthenticated.
- **Driving a local `localhost` build as the default CI target** — CI runs
  against the public Firebase deployment so anyone cloning the repo can
  reproduce green runs without standing up the app. Dev-only mock/network tests
  skip themselves when `TEST_ENV=dev` rather than failing misleadingly.

## Layout: `src/` vs root-level `pages/`

Portfolio checklists often show `pages/` and `fixtures/` at the repo root.
This repo keeps them under `src/` (with `tests/` and `test-data/` at the root)
so application code stays separate from specs — the same split used by most
TypeScript Node projects. Dependency flow is unchanged:
`tests → fixtures → pages → utils/config`.

## Multi-browser + CI

Chromium, Firefox, and WebKit all run in CI. GitHub Actions shards the full
project matrix, merges blob reports into one HTML report, and publishes that
report to GitHub Pages from `main` so the CV can link a stable live URL.
Azure Pipelines and a Jenkinsfile mirror the same stages for interview talking
points about multi-CI integration.

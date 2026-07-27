# Playwright QA Framework — React Shopping Cart

Playwright test suite for the [Typescript React Shopping Cart](https://react-shopping-cart-67954.firebaseapp.com/products) demo application. The app under test is a public deployment and is not part of this repo.

**New here?** [HOW_TO_RUN.txt](HOW_TO_RUN.txt) is setup and every command, step by step; [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) explains what each folder and file is for.

**57 automated tests, all passing** as of 2026-07-27. Three application defects
found — see [docs/defects.md](docs/defects.md).

| Category | Tests | Directory |
|----------|-------|-----------|
| Functional | 17 | `tests/functional/` |
| Negative | 14 | `tests/negative/` |
| Boundary / edge | 9 | `tests/boundary/` |
| End-to-end | 6 | `tests/e2e/` |
| API | 7 | `tests/api/` |
| Performance | 4 | `tests/performance/` |

## Quick Start

```bash
cd playwright-qa-framework
npm install
npx playwright install --with-deps
npm test
```

View report:

```bash
npm run test:report
```

## Project Structure

```
playwright-qa-framework/
├── config/           # Environment configuration
├── src/
│   ├── pages/        # Page Object Model
│   ├── fixtures/     # Custom test fixtures
│   ├── utils/        # Helpers (currency, network, mocks)
│   └── api/          # API client
├── tests/            # Test specs by category
├── test-data/        # Externalized JSON test data
├── docs/             # Test plan, architecture, exploration notes
└── .github/workflows # CI pipeline
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm test` | Run all 57 tests |
| `npm run test:functional` | Functional specs (17) |
| `npm run test:negative` | Negative specs (14) |
| `npm run test:boundary` | Boundary specs (9) |
| `npm run test:e2e` | End-to-end specs (6) |
| `npm run test:api` | API specs (7) |
| `npm run test:performance` | Performance specs (4) |
| `npm run test:dev` / `:staging` / `:prod` | Run against a specific environment |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Playwright UI mode |
| `npm run validate` | TypeScript + ESLint |
| `npm run data:generate` | Regenerate `test-data/mock-products-100.json` |

## Environment Configuration

Copy `.env.example` to `.env` and set:

```env
TEST_ENV=prod   # dev | staging | prod
```

| Environment | Base URL | Notes |
|-------------|----------|-------|
| prod | https://react-shopping-cart-67954.firebaseapp.com | Default; all 57 tests run |
| staging | Same host | Proves the env switch; no separate deployment exists |
| dev | http://localhost:3000 | Local clone; 40 run, 17 skip with a stated reason |

Running against dev requires the app locally:

```bash
git clone https://github.com/jeffersonRibeiro/react-shopping-cart.git ../react-shopping-cart
cd ../react-shopping-cart && npm install --legacy-peer-deps && npm start
npm run test:dev     # back in playwright-qa-framework
```

A dev build resolves its catalog from a bundled JSON module instead of calling
Firebase, so mock-based and network-assertion tests skip themselves rather than
fail misleadingly. See
[architecture.md](docs/architecture.md#environment-status).

## Task 1 Summary

Automated scenario:

1. Reads the expected match set from the live `products.json` (source of truth)
2. Reads all catalog prices from the rendered UI and reconciles the two
3. Identifies products at exactly **$10.90** and **$14.90** — currently 6, but the
   count is derived, never hardcoded
4. Adds every match to the cart
5. Validates name, unit price, quantity and subtotal per line
6. Validates total quantity and grand total (currently $73.40, computed from the
   line data rather than asserted as a literal)

Spec: `tests/functional/cart-price-validation.spec.ts`

## CI/CD

[![Playwright Tests](https://github.com/SatyamChouksey-88/playwright-qa-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/SatyamChouksey-88/playwright-qa-framework/actions/workflows/playwright.yml)

- **GitHub Actions:** `.github/workflows/playwright.yml` — sharded runs, merged HTML report
- **Azure DevOps:** `azure-pipelines.yml` — JUnit + HTML artifacts
- **Docker:** `docker/Dockerfile` — official Playwright image

## Documentation

| Document | Purpose |
|----------|---------|
| [exploration-notes.md](docs/exploration-notes.md) | Phase 0 DOM/network findings |
| [test-plan.md](docs/test-plan.md) | Comprehensive test plan |
| [test-cases.md](docs/test-cases.md) | Detailed test case catalog |
| [architecture.md](docs/architecture.md) | Framework design |
| [mcp-ai-workflow.md](docs/mcp-ai-workflow.md) | AI/MCP workflow evidence |
| [defects.md](docs/defects.md) | Application defects found, with reproduction |
| [demo/README.md](docs/demo/README.md) | Annotated walkthrough with screenshots |
| [exploratory-charters.md](docs/exploratory-charters.md) | Exploratory testing charters |
| [failure-analysis-example.md](docs/failure-analysis-example.md) | Worked failure analysis |

## Walkthrough

See [docs/demo/README.md](docs/demo/README.md) for the annotated walkthrough with
captured screenshots of the suite run, the HTML report, and the project layout.

## Playwright MCP Setup

MCP (Model Context Protocol) lets an AI agent drive a real browser. The config
below is what this project used; it is not shipped in the repo, because
`.cursor/` is local editor config. Create `.cursor/mcp.json` yourself if you want
it:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

## License

MIT — for educational / assignment use.

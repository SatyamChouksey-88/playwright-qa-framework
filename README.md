# Playwright QA Framework — React Shopping Cart

Enterprise-grade Playwright automation framework for the [Typescript React Shopping Cart](https://react-shopping-cart-67954.firebaseapp.com/products) demo application.

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
| `npm test` | Run all tests |
| `npm run test:functional` | Task 1 cart validation specs |
| `npm run test:api` | API tests only |
| `npm run test:headed` | Run with visible browser |
| `npm run test:ui` | Playwright UI mode |
| `npm run validate` | TypeScript + ESLint |

## Environment Configuration

Copy `.env.example` to `.env` and set:

```env
TEST_ENV=prod   # dev | staging | prod
```

| Environment | Base URL |
|-------------|----------|
| prod | https://react-shopping-cart-67954.firebaseapp.com |
| dev | http://localhost:3000 (local clone) |

## Task 1 Summary

Automated scenario:
1. Dynamically reads all catalog prices from the live UI
2. Identifies products at exactly **$10.90** and **$14.90** (6 products)
3. Adds all matches to cart
4. Validates name, price, quantity per line
5. Validates subtotals, total quantity, and grand total ($73.40)

Spec: `tests/functional/cart-price-validation.spec.ts`

## CI/CD

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

## Walkthrough Script

1. `npm test` — observe 14 tests pass
2. `npm run test:report` — open HTML report, drill into TC-CART-001 steps
3. Show `docs/exploration-notes.md` — API URL, filter behavior, locators
4. Show `src/pages/` — POM with centralized locators
5. Show `test-data/price-filters.json` — externalized target prices
6. Push to GitHub — show Actions workflow running sharded tests
7. Download `playwright-html-report` artifact from CI

## Playwright MCP Setup

Add to Cursor MCP settings (`.cursor/mcp.json` included):

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

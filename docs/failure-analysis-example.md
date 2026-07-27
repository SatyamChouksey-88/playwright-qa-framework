# Failure Analysis Example

## Test

`TC-CART-001` — Validate line item price after adding products

## Symptom

```
expect(pricesEqual(line.unitPrice, expected.unitPrice)).toBeTruthy()
Received: false
```

Expected `10.9`, received `0`.

## Investigation Steps

1. Opened HTML report: `npx playwright show-report`
2. Inspected trace screenshot — cart visually showed `$ 10.90` for the line item
3. Read `error-context.md` page snapshot:

```yaml
- paragraph [ref=e223]: $ 10.90
```

4. Reviewed `parseUnitPriceFromLineText()` — regex was `\$(\d+\.\d{2})` requiring `$` immediately followed by digits

## Root Cause

The application renders cart prices with a **space** after the dollar sign (`$ 10.90`), while the catalog renders without a space (`$10.90`). The strict regex returned no matches, defaulting `unitPrice` to `0`.

## Fix

```typescript
// Before (broken)
/\$(\d+\.\d{2})/g

// After (fixed)
/\$\s*(\d+\.\d{2})/g
```

Applied in `src/pages/cart.component.ts` and catalog parsing in `src/pages/products.page.ts`.

## Prevention

- Always verify **display format** in Phase 0, not just numeric API values
- Prefer `parseCurrency()` which strips all non-numeric characters
- Add cart-specific price assertion separate from catalog parsing

## Classification

**Test framework bug** — not an application defect.

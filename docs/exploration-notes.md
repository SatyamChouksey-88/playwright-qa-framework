# Phase 0 — Application Exploration Notes

**Explored:** 2026-07-27  
**Target:** https://react-shopping-cart-67954.firebaseapp.com/products  
**Source repo:** [jeffersonRibeiro/react-shopping-cart](https://github.com/jeffersonRibeiro/react-shopping-cart)  
**MCP status:** Playwright MCP server was **not connected** in this session. Exploration used live Playwright script (`scripts/explore.mjs`) plus source-code review of the open-source repo.

---

## Routes

| URL | Behavior |
|-----|----------|
| `/` | Product listing (same view) |
| `/products` | Product listing (same view) |

Both routes render the same SPA product catalog. Title: **Typescript React Shopping cart**.

---

## Product Data Source

| Property | Value |
|----------|-------|
| Method | `GET` |
| URL | `https://react-shopping-cart-67954.firebaseio.com/products.json` |
| Trigger | Once on initial page load via `getProducts()` |
| Response shape | `{ products: Product[] }` |

### Sample product object

```json
{
  "id": 0,
  "sku": 8552515751438644,
  "title": "Cropped Stay Groovy off white",
  "description": "14/15 s/nº",
  "availableSizes": ["X", "L", "XL", "XXL"],
  "style": "White T-shirt",
  "price": 10.9,
  "installments": 9,
  "currencyId": "USD",
  "currencyFormat": "$",
  "isFreeShipping": true
}
```

**Note:** API uses numeric `price` (e.g. `10.9`) but UI displays `$10.90` via `formatPrice()` → `toFixed(2)`.

---

## Products at Target Prices (live catalog)

| Price (numeric) | Display | Count | Titles |
|-----------------|---------|-------|--------|
| 10.9 | $10.90 | 4 | Cropped Stay Groovy off white, Black Batman T-shirt, Ringer Hall Pass, Turtles Ninja T-shirt |
| 14.9 | $14.90 | 2 | Grey T-shirt, Black T-shirt with white stripes |

**Total matching Task 1:** 6 products.

---

## Size Filter Behavior

**Finding:** Filtering triggers a **new network request** but **does not pass filter params**.

From `useProducts.tsx`:
1. `filterProducts()` calls `getProducts()` again (re-fetches full `products.json`).
2. Filters client-side: `products.filter(p => filters.find(f => p.availableSizes.find(size => size === f)))`.

| Action | Network request? | Filter in URL? |
|--------|------------------|----------------|
| Page load | Yes — GET products.json | No |
| Toggle size checkbox | Yes — GET products.json again | No — client-side filter after re-fetch |

**Checkbox interaction:** `[data-testid="checkbox"]` exists on `<input type="checkbox">`. A `<span class="checkmark">` overlays the input and intercepts pointer events in Playwright — click the **label text** (e.g. `getByText('XS', { exact: true })`) or use `{ force: true }`.

**Available filter sizes (UI):** XS, S, M, ML, L, XL, XXL  
**API size values:** Mixed — uses `"X"` instead of `"XS"` in some products; filter matches exact string equality.

---

## DOM Structure & Locators

| Element | Locator strategy | Notes |
|---------|------------------|-------|
| Size checkbox input | `getByTestId('checkbox')` | Confirmed; click via label |
| Size label | `getByText('XS', { exact: true })` etc. | Avoids overlay intercept |
| Product card | `div[tabindex="1"]` | One card per product; filter by title text |
| Product title | `.filter({ hasText: title })` on card | Styled `<p>` inside card |
| Product price | Text matching `/\$\d+\.\d{2}/` inside card | Split display: dollars + cents in `<b>` |
| Add to cart | `getByRole('button', { name: 'Add to cart' })` | Scoped inside product card |
| Product count | Text `/\d+ Product\(s\) found/` | Updates after filter |
| Cart toggle / badge | `[title="Products in cart quantity"]` | Shows total item quantity |
| Cart drawer | Text `Cart` (header) | Opens automatically on add |
| Cart line item | Container with `[title="remove product from cart"]` | One per SKU |
| Line title | Text inside line item container | Matches product title |
| Line price | `$XX.XX` in line item | Unit price, not subtotal |
| Quantity display | Text `Quantity: N` | In line description |
| Decrease qty | Button `-` in line item | **Disabled when quantity === 1** |
| Increase qty | Button `+` in line item | Always enabled |
| Remove line | `[title="remove product from cart"]` | Deletes entire line |
| Subtotal label | Text `SUBTOTAL` | Footer of cart |
| Grand total | SubPriceValue area after SUBTOTAL | Plain sum — no tax/shipping added |
| Checkout | `getByRole('button', { name: 'Checkout' })` | Shows alert with subtotal |

**No `data-testid` on:** product cards, add-to-cart buttons, cart lines, prices (only checkboxes have test ids).

---

## Cart Math

- **Line subtotal:** `unit price × quantity` (not shown separately per line; only unit price displayed).
- **Grand total:** Sum of `(price × quantity)` for all lines — no tax, no shipping fee in total.
- **Total quantity badge:** Sum of all line quantities (not distinct SKU count).
- **Duplicate add:** Same product ID increments quantity on existing line (no duplicate lines).

---

## Quantity-to-Zero Behavior

The `-` button is **disabled at quantity 1** (UI guard). Decreasing to 0 via stepper is **not possible**. Removing a line requires the **delete button** (`title="remove product from cart"`). Tests for "empty line" should use remove button or validate minus is disabled at qty 1.

---

## Rendering at Scale

Default catalog: **16 products**, plain list (no pagination, no virtualization). All cards render in DOM simultaneously. Performance test mocks 100 products via network interception.

---

## Checkout

Checkout button exists but only shows a JavaScript `alert()` with subtotal — no payment flow. Mark as **out of scope** for deep E2E payment testing; smoke-test alert only.

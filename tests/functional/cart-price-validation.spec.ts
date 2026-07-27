import { test, expect } from '../../src/fixtures/test-fixtures';
import priceFilters from '../../test-data/price-filters.json';
import { pricesEqual } from '../../src/utils/currency.util';
import {
  excludeProductsByPrices,
  filterProductsByPrices,
} from '../../src/utils/mock-data.generator';
import { CartLineValidation } from '../../src/types/product.types';
import {
  mockProductsCatalog,
  skipUnlessCatalogIsNetworked,
} from '../../src/utils/api-mock.util';

test.describe('Task 1 — Product Selection & Cart Validation', () => {
  test('TC-CART-001: add all $10.90 and $14.90 products and validate cart totals', async ({
    productsPage,
    productsApi,
    cart,
  }) => {
    const targetPrices = priceFilters.targetPrices as number[];

    // Expected count comes from the API (the catalog's source of truth) so the
    // UI reading is cross-checked against data rather than a baked-in number.
    const apiMatches = filterProductsByPrices(await productsApi.fetchProducts(), targetPrices);
    expect(apiMatches.length).toBeGreaterThan(0);

    await productsPage.gotoProducts();

    const catalog = await productsPage.getAllCatalogProducts();
    const matching = catalog.filter((p) =>
      targetPrices.some((price) => pricesEqual(p.price, price))
    );

    expect(matching.length).toBe(apiMatches.length);
    expect(matching.map((p) => p.title).sort()).toEqual(
      apiMatches.map((p) => p.title).sort()
    );

    // Guards the display format itself, not just the numeric value: a regression
    // to "$10.9" or "10.90" would still parse to the right number.
    const displayPrices = priceFilters.displayPrices as string[];
    for (const product of matching) {
      expect(displayPrices).toContain(product.priceText.replace(/\$\s+/, '$'));
    }

    const expectedLines: CartLineValidation[] = [];

    for (const product of matching) {
      await test.step(`Add "${product.title}" at ${product.priceText}`, async () => {
        await productsPage.addProductToCart(product.title);
        expectedLines.push({
          title: product.title,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price,
        });
      });
    }

    for (const expected of expectedLines) {
      await test.step(`Validate line item: ${expected.title}`, async () => {
        const line = await cart.getLineDetails(expected.title);
        expect(line.title).toContain(expected.title.split(' ')[0]);
        expect(pricesEqual(line.unitPrice, expected.unitPrice)).toBeTruthy();
        expect(line.quantity).toBe(expected.quantity);
        expect(pricesEqual(line.subtotal, expected.subtotal)).toBeTruthy();
      });
    }

    await test.step('Validate cart math', async () => {
      await cart.validateCartMath(expectedLines);
    });
  });

  test('TC-CART-002: zero price matches — cart stays empty with mocked API', async ({
    page,
    productsPage,
    cart,
    productsApi,
  }) => {
    skipUnlessCatalogIsNetworked();

    const allProducts = await productsApi.fetchProducts();
    const filtered = excludeProductsByPrices(allProducts, priceFilters.targetPrices as number[]);

    await mockProductsCatalog(page, filtered);
    await productsPage.gotoProducts();
    const catalog = await productsPage.getAllCatalogProducts();
    const matching = catalog.filter((p) =>
      (priceFilters.targetPrices as number[]).some((price) => pricesEqual(p.price, price))
    );

    expect(matching).toHaveLength(0);
    expect(catalog.length).toBeGreaterThan(0);
    expect(await cart.getTotalQuantity()).toBe(0);
    expect(await cart.getGrandTotal()).toBe(0);
  });

  test('TC-CART-003: removing a line clears it and recalculates totals', async ({
    productsPage,
    cart,
  }) => {
    await productsPage.gotoProducts();

    const [lowerTargetPrice] = priceFilters.targetPrices as number[];
    const catalog = await productsPage.getAllCatalogProducts();
    const target = catalog.find((p) => pricesEqual(p.price, lowerTargetPrice));
    expect(target).toBeDefined();

    await productsPage.addProductToCart(target!.title);
    await cart.removeLine(target!.title);

    await expect(cart.lineItemByTitle(target!.title)).toHaveCount(0);
    expect(await cart.getTotalQuantity()).toBe(0);
    expect(await cart.getGrandTotal()).toBe(0);
  });

  test('TC-CART-004: duplicate add increments quantity instead of creating new line', async ({
    productsPage,
    cart,
  }) => {
    await productsPage.gotoProducts();

    const targetPrices = priceFilters.targetPrices as number[];
    const upperTargetPrice = targetPrices[targetPrices.length - 1];
    const catalog = await productsPage.getAllCatalogProducts();
    const target = catalog.find((p) => pricesEqual(p.price, upperTargetPrice));
    expect(target).toBeDefined();

    await productsPage.addProductToCart(target!.title);
    await productsPage.addProductToCart(target!.title);

    const line = await cart.getLineDetails(target!.title);
    expect(line.quantity).toBe(2);
    expect(pricesEqual(line.subtotal, target!.price * 2)).toBeTruthy();
    expect(await cart.getTotalQuantity()).toBe(2);
  });
});

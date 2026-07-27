import { test, expect } from '../../src/fixtures/test-fixtures';
import priceFilters from '../../test-data/price-filters.json';
import { pricesEqual } from '../../src/utils/currency.util';
import { filterProductsByPrices } from '../../src/utils/mock-data.generator';

test.describe('Boundary — Price filtering', () => {
  test('TC-BND-001: catalog price matches reconcile exactly with the API', async ({
    productsPage,
    productsApi,
  }) => {
    const targetPrices = priceFilters.targetPrices as number[];
    const apiProducts = await productsApi.fetchProducts();
    const apiMatches = filterProductsByPrices(apiProducts, targetPrices);

    await productsPage.gotoProducts();
    const catalog = await productsPage.getAllCatalogProducts();
    const uiMatches = catalog.filter((p) =>
      targetPrices.some((price) => pricesEqual(p.price, price))
    );

    expect(uiMatches.length).toBe(apiMatches.length);

    for (const price of targetPrices) {
      await test.step(`Price ${price} count matches API`, async () => {
        const apiCount = apiProducts.filter((p) => pricesEqual(p.price, price)).length;
        const uiCount = uiMatches.filter((p) => pricesEqual(p.price, price)).length;
        expect(apiCount).toBeGreaterThan(0);
        expect(uiCount).toBe(apiCount);
      });
    }
  });

  test('TC-BND-002: toggling size filter changes then restores product count', async ({
    productsPage,
    productsApi,
    filter,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    const expectedFiltered = apiProducts.filter((p) => p.availableSizes.includes('M')).length;

    await productsPage.gotoProducts();

    const initialCount = await productsPage.getProductCountFromLabel();
    expect(initialCount).toBe(apiProducts.length);

    await filter.toggleSize('M');
    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBe(expectedFiltered);

    await filter.toggleSize('M');
    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBe(initialCount);
  });
});

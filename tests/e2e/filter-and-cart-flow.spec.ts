import { test, expect } from '../../src/fixtures/test-fixtures';
import { pricesEqual } from '../../src/utils/currency.util';
import priceFilters from '../../test-data/price-filters.json';
import { filterProductsByPrices } from '../../src/utils/mock-data.generator';
import { skipUnlessCatalogIsNetworked } from '../../src/utils/api-mock.util';

test.describe('E2E — Filter network behavior & shopping flow', () => {
  test('TC-E2E-001: size filter triggers products.json re-fetch without query params', async ({
    productsPage,
    filter,
    page,
  }) => {
    skipUnlessCatalogIsNetworked();
    await productsPage.gotoProducts();

    const capturedUrls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('products.json')) capturedUrls.push(req.url());
    });

    const requestsDuringToggle = await filter.countProductFetchRequestsDuringToggle('L');
    expect(requestsDuringToggle).toBe(1);

    expect(capturedUrls.length).toBeGreaterThanOrEqual(1);
    capturedUrls.forEach((url) => {
      expect(url).toMatch(/products\.json/);
      expect(url).not.toMatch(/size=|filter=/);
    });
  });

  test('TC-E2E-002: full flow — filter, add matching product, validate cart', async ({
    productsPage,
    productsApi,
    filter,
    cart,
  }) => {
    const filterSize = 'L';
    const targetPrices = priceFilters.targetPrices as number[];

    // The expected match count is derived from the API for the same size filter,
    // so "zero matches" is only tolerated when the data genuinely has none.
    const apiProducts = await productsApi.fetchProducts();
    const apiMatches = filterProductsByPrices(apiProducts, targetPrices).filter((p) =>
      p.availableSizes.includes(filterSize)
    );
    const expectedAfterFilter = apiProducts.filter((p) =>
      p.availableSizes.includes(filterSize)
    ).length;

    await productsPage.gotoProducts();
    await filter.toggleSize(filterSize);
    await productsPage.waitForProductCount(expectedAfterFilter);

    const catalog = await productsPage.getAllCatalogProducts();
    const matching = catalog.filter((p) =>
      targetPrices.some((price) => pricesEqual(p.price, price))
    );

    expect(matching.length).toBe(apiMatches.length);

    if (apiMatches.length === 0) {
      test.skip(true, `No ${targetPrices.join('/')} product carries size ${filterSize}`);
    }

    const product = matching[0];
    await productsPage.addProductToCart(product.title);

    const line = await cart.getLineDetails(product.title);
    expect(pricesEqual(line.unitPrice, product.price)).toBeTruthy();
    expect(line.quantity).toBe(1);
  });
});

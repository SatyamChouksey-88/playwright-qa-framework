import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('Functional — Size filter behaviour', () => {
  test('TC-FILTER-001: filtering by one size shows exactly the API-matching products', async ({
    productsPage,
    productsApi,
    filter,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    const expectedCount = apiProducts.filter((p) => p.availableSizes.includes('M')).length;
    expect(expectedCount).toBeGreaterThan(0);

    await productsPage.gotoProducts();
    await filter.toggleSize('M');

    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBe(expectedCount);
  });

  test('TC-FILTER-002: two sizes combine as a union, not an intersection', async ({
    productsPage,
    productsApi,
    filter,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    const union = apiProducts.filter(
      (p) => p.availableSizes.includes('M') || p.availableSizes.includes('S')
    ).length;
    const intersection = apiProducts.filter(
      (p) => p.availableSizes.includes('M') && p.availableSizes.includes('S')
    ).length;

    expect(union).toBeGreaterThan(intersection);

    await productsPage.gotoProducts();
    await filter.selectSizes(['M', 'S']);

    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBe(union);
  });

  test('TC-FILTER-003: unchecking the last size restores the full catalog', async ({
    productsPage,
    productsApi,
    filter,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    await productsPage.gotoProducts();

    await filter.toggleSize('S');
    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBeLessThan(apiProducts.length);

    await filter.toggleSize('S');
    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBe(apiProducts.length);
  });
});

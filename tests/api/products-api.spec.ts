import { test, expect } from '../../src/fixtures/test-fixtures';
import {
  UI_FILTER_SIZES,
  sizesMatchUiFilters,
  validateProductSizeCodes,
} from '../../src/utils/size-codes.util';
import boundaryValues from '../../test-data/boundary-values.json';

test.describe('API — Products endpoint', () => {
  test('TC-API-001: every product has valid abbreviated size codes', async ({ productsApi }) => {
    const products = await productsApi.fetchProducts();

    // A minimum, not an exact count: the catalog is external data that may grow,
    // and pinning the exact size would fail on a legitimate content change while
    // proving nothing about the size codes this test exists to check.
    expect(products.length).toBeGreaterThanOrEqual(boundaryValues.minimumCatalogSize);

    for (const product of products) {
      await test.step(`Product "${product.title}" sizes are valid codes`, async () => {
        const error = validateProductSizeCodes(product.availableSizes);
        expect(error, `Product "${product.title}": ${error}`).toBeNull();
      });
    }
  });

  test('TC-API-002: API sizes align with UI filter checkboxes', async ({
    productsApi,
    productsPage,
    filter,
  }) => {
    const products = await productsApi.fetchProducts();
    const apiSizes = await productsApi.getAllSizes();

    await productsPage.gotoProducts();
    const uiSizes = await filter.getVisibleSizes();

    expect(sizesMatchUiFilters(uiSizes)).toBe(true);

    for (const apiSize of apiSizes) {
      await test.step(`API size "${apiSize}" is an allowed abbreviated code`, async () => {
        const error = validateProductSizeCodes([apiSize]);
        expect(error, `API size "${apiSize}": ${error}`).toBeNull();
      });
    }

    for (const uiSize of UI_FILTER_SIZES) {
      await test.step(`At least one product is available in UI filter size "${uiSize}"`, async () => {
        const matches = products.filter((p) => p.availableSizes.includes(uiSize));
        expect(matches.length).toBeGreaterThan(0);
      });
    }
  });

  test('TC-API-003: each UI filter size code appears on at least one product', async ({
    productsApi,
  }) => {
    const products = await productsApi.fetchProducts();

    for (const sizeCode of UI_FILTER_SIZES) {
      await test.step(`Catalog includes products with size "${sizeCode}"`, async () => {
        const withSize = products.filter((p) => p.availableSizes.includes(sizeCode));
        expect(withSize.length).toBeGreaterThan(0);
      });
    }
  });
});

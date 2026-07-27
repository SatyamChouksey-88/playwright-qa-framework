import { test, expect } from '../../src/fixtures/test-fixtures';
import {
  mockProductsCatalog,
  mockProductsFailure,
  mockProductsMalformed,
  skipUnlessCatalogIsNetworked,
} from '../../src/utils/api-mock.util';

/**
 * Behaviour in this file was captured from the live app via
 * scripts/probe-error-states.mjs before the assertions were written — see
 * docs/defects.md for the two defects these tests pin down.
 */
test.describe('Negative — Products API failure handling', () => {
  const sizesHeading = 'Sizes:';

  test.beforeEach(() => skipUnlessCatalogIsNetworked());

  test('TC-NEG-007: an empty catalog renders "0 Product(s) found" with no page errors', async ({
    page,
    productsPage,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await mockProductsCatalog(page, []);
    await productsPage.gotoProductsExpectingNoCatalog();

    expect(await productsPage.getProductCountFromLabel()).toBe(0);
    expect(await productsPage.productCard.count()).toBe(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('TC-NEG-008: an empty catalog keeps the size filter rendered and interactive', async ({
    page,
    productsPage,
    filter,
  }) => {
    await mockProductsCatalog(page, []);
    await productsPage.gotoProductsExpectingNoCatalog();

    await expect(page.getByText(sizesHeading, { exact: true })).toBeVisible();
    expect(await filter.getVisibleSizes()).toHaveLength(7);

    await filter.toggleSize('M');
    expect(await productsPage.getProductCountFromLabel()).toBe(0);
  });

  test('TC-NEG-009: an empty catalog leaves the cart at zero and checkout guarded', async ({
    page,
    productsPage,
    cart,
  }) => {
    const dialogMessage = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    await mockProductsCatalog(page, []);
    await productsPage.gotoProductsExpectingNoCatalog();

    expect(await cart.getTotalQuantity()).toBe(0);

    await cart.openCart();
    await cart.checkoutButton.click();
    expect(await dialogMessage).toContain('Add some product');
  });

  test('TC-NEG-010: an HTTP 500 degrades to zero products without blanking the page', async ({
    page,
    productsPage,
  }) => {
    await mockProductsFailure(page, 500);
    await productsPage.gotoProductsExpectingNoCatalog();

    await expect(page.getByText(sizesHeading, { exact: true })).toBeVisible();
    expect(await productsPage.getProductCountFromLabel()).toBe(0);
    expect(await productsPage.productCard.count()).toBe(0);
  });

  test('TC-NEG-011: DEF-001 — an HTTP 500 surfaces an unhandled rejection', async ({
    page,
    productsPage,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await mockProductsFailure(page, 500);
    await productsPage.gotoProductsExpectingNoCatalog();
    await expect(page.getByText(sizesHeading, { exact: true })).toBeVisible();

    // Regression guard for a known application defect: getProducts() has no
    // rejection handler, so a failed fetch escapes as an unhandled rejection.
    // When the app fixes this, the assertion below should be inverted.
    await expect
      .poll(() => pageErrors.some((message) => message.includes('500')), { timeout: 10_000 })
      .toBe(true);
  });

  test('TC-NEG-012: DEF-002 — malformed JSON leaves the catalog stuck with no count label', async ({
    page,
    productsPage,
  }) => {
    await mockProductsMalformed(page);
    await page.goto('/products');

    await expect(page.getByText(sizesHeading, { exact: true })).toBeVisible();

    // The count label is rendered only after a successful parse, so its absence
    // pins the "infinite fetching" state documented as DEF-002.
    await expect(productsPage.productCountLabel).toHaveCount(0);
    expect(await productsPage.productCard.count()).toBe(0);
  });

  test('TC-NEG-013: a slow catalog response still renders once it resolves', async ({
    page,
    productsPage,
    productsApi,
  }) => {
    const products = await productsApi.fetchProducts();
    await mockProductsCatalog(page, products, { delayMs: 3000 });

    await productsPage.gotoProducts();

    expect(await productsPage.getProductCountFromLabel()).toBe(products.length);
  });

  test('TC-NEG-014: a catalog with no product in the selected size filters to zero', async ({
    page,
    productsPage,
    productsApi,
    filter,
  }) => {
    const products = await productsApi.fetchProducts();
    const withoutMedium = products.filter((p) => !p.availableSizes.includes('M'));

    expect(withoutMedium.length).toBeGreaterThan(0);

    await mockProductsCatalog(page, withoutMedium);
    await productsPage.gotoProducts();

    await filter.toggleSize('M');

    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 15_000 })
      .toBe(0);
  });
});

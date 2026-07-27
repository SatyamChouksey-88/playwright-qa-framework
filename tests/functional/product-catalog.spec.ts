import { test, expect } from '../../src/fixtures/test-fixtures';
import { pricesEqual } from '../../src/utils/currency.util';

test.describe('Functional — Catalog rendering matches API data', () => {
  test('TC-PROD-001: rendered card count equals the product count label and API length', async ({
    productsPage,
    productsApi,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    await productsPage.gotoProducts();

    expect(await productsPage.productCard.count()).toBe(apiProducts.length);
    expect(await productsPage.getProductCountFromLabel()).toBe(apiProducts.length);
  });

  test('TC-PROD-002: every API product title is rendered in the catalog', async ({
    productsPage,
    productsApi,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    await productsPage.gotoProducts();
    const uiProducts = await productsPage.getAllCatalogProducts();
    const uiTitles = uiProducts.map((p) => p.title);

    for (const apiProduct of apiProducts) {
      await test.step(`Catalog renders "${apiProduct.title}"`, async () => {
        expect(uiTitles).toContain(apiProduct.title);
      });
    }
  });

  test('TC-PROD-003: displayed price matches the API price for every product', async ({
    productsPage,
    productsApi,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    await productsPage.gotoProducts();
    const uiProducts = await productsPage.getAllCatalogProducts();

    for (const apiProduct of apiProducts) {
      await test.step(`"${apiProduct.title}" displays ${apiProduct.price}`, async () => {
        const uiProduct = uiProducts.find((p) => p.title === apiProduct.title);
        expect(uiProduct, `"${apiProduct.title}" missing from catalog`).toBeDefined();
        expect(pricesEqual(uiProduct!.price, apiProduct.price)).toBeTruthy();
        expect(uiProduct!.priceText).toMatch(/^\$\s?\d+\.\d{2}$/);
      });
    }
  });

  test('TC-PROD-004: free shipping badge appears only for isFreeShipping products', async ({
    productsPage,
    productsApi,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    await productsPage.gotoProducts();

    for (const product of apiProducts) {
      await test.step(`"${product.title}" badge = ${product.isFreeShipping}`, async () => {
        const badge = productsPage.freeShippingBadgeInCard(product.title);
        const expectedCount = product.isFreeShipping ? 1 : 0;
        expect(await badge.count()).toBe(expectedCount);
      });
    }
  });

  test('TC-PROD-005: installment text is shown only when installments > 0', async ({
    productsPage,
    productsApi,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    await productsPage.gotoProducts();

    for (const product of apiProducts) {
      await test.step(`"${product.title}" installments = ${product.installments}`, async () => {
        const installmentNode = productsPage.installmentTextInCard(product.title);

        if (product.installments > 0) {
          const text = await installmentNode.first().innerText();
          const shownCount = Number.parseInt(text.match(/or (\d+) x/)?.[1] ?? '0', 10);
          expect(shownCount).toBe(product.installments);
        } else {
          expect(await installmentNode.count()).toBe(0);
        }
      });
    }
  });
});

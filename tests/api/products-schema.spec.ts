import { test, expect } from '../../src/fixtures/test-fixtures';
import { productsApiUrl } from '../../src/utils/api-mock.util';

test.describe('API — Products payload contract', () => {
  test('TC-API-004: every product exposes the fields the UI depends on', async ({
    productsApi,
  }) => {
    const products = await productsApi.fetchProducts();

    for (const product of products) {
      await test.step(`"${product.title}" satisfies the contract`, async () => {
        expect(typeof product.id).toBe('number');
        expect(typeof product.sku).toBe('number');
        expect(typeof product.title).toBe('string');
        expect(product.title.length).toBeGreaterThan(0);
        expect(typeof product.price).toBe('number');
        expect(typeof product.installments).toBe('number');
        expect(typeof product.isFreeShipping).toBe('boolean');
        expect(product.currencyFormat).toBe('$');
        expect(product.currencyId).toBe('USD');
        expect(Array.isArray(product.availableSizes)).toBe(true);
      });
    }
  });

  test('TC-API-005: product ids and skus are unique across the catalog', async ({
    productsApi,
  }) => {
    const products = await productsApi.fetchProducts();

    const ids = products.map((p) => p.id);
    const skus = products.map((p) => p.sku);

    expect(new Set(ids).size).toBe(products.length);
    expect(new Set(skus).size).toBe(products.length);
  });

  test('TC-API-006: prices are positive and installments are never negative', async ({
    productsApi,
  }) => {
    const products = await productsApi.fetchProducts();

    for (const product of products) {
      await test.step(`"${product.title}" price ${product.price}`, async () => {
        expect(product.price).toBeGreaterThan(0);
        expect(product.installments).toBeGreaterThanOrEqual(0);
      });
    }
  });

  test('TC-API-007: the products endpoint responds 200 as JSON within budget', async ({
    request,
  }) => {
    const budgetMs = 5000;
    const startedAt = Date.now();
    const response = await request.get(productsApiUrl());
    const elapsed = Date.now() - startedAt;

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('json');
    expect(elapsed).toBeLessThan(budgetMs);

    const body = await response.json();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
  });
});

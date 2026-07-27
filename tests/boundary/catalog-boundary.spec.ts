import { test, expect } from '../../src/fixtures/test-fixtures';
import {
  mockProductsCatalog,
  skipUnlessCatalogIsNetworked,
} from '../../src/utils/api-mock.util';
import { cloneProductWith } from '../../src/utils/mock-data.generator';
import { pricesEqual, roundCurrency } from '../../src/utils/currency.util';
import { UI_FILTER_SIZES } from '../../src/utils/size-codes.util';
import boundaryValues from '../../test-data/boundary-values.json';

test.describe('Boundary — Catalog size and price extremes', () => {
  test('TC-BND-003: a single-product catalog renders and adds correctly', async ({
    page,
    productsPage,
    productsApi,
    cart,
  }) => {
    skipUnlessCatalogIsNetworked();

    const [firstProduct] = await productsApi.fetchProducts();
    await mockProductsCatalog(page, [firstProduct]);
    await productsPage.gotoProducts();

    expect(await productsPage.getProductCountFromLabel()).toBe(1);
    expect(await productsPage.productCard.count()).toBe(1);

    await productsPage.addProductToCart(firstProduct.title);
    expect(pricesEqual(await cart.getGrandTotal(), firstProduct.price)).toBeTruthy();
  });

  test('TC-BND-004: the highest-priced catalog item calculates its total exactly', async ({
    productsPage,
    productsApi,
    cart,
  }) => {
    const products = await productsApi.fetchProducts();
    const mostExpensive = products.reduce((max, p) => (p.price > max.price ? p : max));

    await productsPage.gotoProducts();
    await productsPage.addProductToCart(mostExpensive.title);

    const line = await cart.getLineDetails(mostExpensive.title);
    expect(pricesEqual(line.unitPrice, mostExpensive.price)).toBeTruthy();
    expect(pricesEqual(await cart.getGrandTotal(), mostExpensive.price)).toBeTruthy();
  });

  test('TC-BND-005: the lowest-priced catalog item calculates its total exactly', async ({
    productsPage,
    productsApi,
    cart,
  }) => {
    const products = await productsApi.fetchProducts();
    const cheapest = products.reduce((min, p) => (p.price < min.price ? p : min));

    await productsPage.gotoProducts();
    await productsPage.addProductToCart(cheapest.title);

    const line = await cart.getLineDetails(cheapest.title);
    expect(pricesEqual(line.unitPrice, cheapest.price)).toBeTruthy();
    expect(pricesEqual(await cart.getGrandTotal(), cheapest.price)).toBeTruthy();
  });

  test('TC-BND-006: selecting every filter size shows the full union of products', async ({
    productsPage,
    productsApi,
    filter,
  }) => {
    const products = await productsApi.fetchProducts();
    const expectedUnion = products.filter((p) =>
      p.availableSizes.some((size) => UI_FILTER_SIZES.includes(size))
    ).length;

    await productsPage.gotoProducts();
    await filter.selectSizes([...UI_FILTER_SIZES]);

    await expect
      .poll(async () => productsPage.getProductCountFromLabel(), { timeout: 20_000 })
      .toBe(expectedUnion);
  });

  test('TC-BND-007: a high quantity keeps the grand total precise', async ({
    productsPage,
    productsApi,
    cart,
  }) => {
    const targetQuantity = boundaryValues.highQuantity;
    const products = await productsApi.fetchProducts();
    const product = products[0];

    await productsPage.gotoProducts();
    await productsPage.addProductToCart(product.title);

    for (let i = 1; i < targetQuantity; i++) {
      await cart.increaseQuantity(product.title);
    }

    const line = await cart.getLineDetails(product.title);
    expect(line.quantity).toBe(targetQuantity);
    expect(await cart.getTotalQuantity()).toBe(targetQuantity);
    expect(
      pricesEqual(await cart.getGrandTotal(), roundCurrency(product.price * targetQuantity))
    ).toBeTruthy();
  });

  test('TC-BND-008: the minimum boundary price renders and totals without rounding loss', async ({
    page,
    productsPage,
    productsApi,
    cart,
  }) => {
    skipUnlessCatalogIsNetworked();

    const minimumPrice = boundaryValues.edgePrices.minimum;
    const [base] = await productsApi.fetchProducts();
    const product = cloneProductWith(base, {
      title: 'Boundary Minimum Price Item',
      price: minimumPrice,
      installments: 0,
    });

    await mockProductsCatalog(page, [product]);
    await productsPage.gotoProducts();
    await productsPage.addProductToCart(product.title);

    const line = await cart.getLineDetails(product.title);
    expect(pricesEqual(line.unitPrice, minimumPrice)).toBeTruthy();
    expect(pricesEqual(await cart.getGrandTotal(), minimumPrice)).toBeTruthy();
  });

  test('TC-BND-009: the maximum boundary price renders and totals without truncation', async ({
    page,
    productsPage,
    productsApi,
    cart,
  }) => {
    skipUnlessCatalogIsNetworked();

    const maximumPrice = boundaryValues.edgePrices.maximum;
    const [base] = await productsApi.fetchProducts();
    const product = cloneProductWith(base, {
      title: 'Boundary Maximum Price Item',
      price: maximumPrice,
      installments: 0,
    });

    await mockProductsCatalog(page, [product]);
    await productsPage.gotoProducts();
    await productsPage.addProductToCart(product.title);

    const line = await cart.getLineDetails(product.title);
    expect(pricesEqual(line.unitPrice, maximumPrice)).toBeTruthy();
    expect(pricesEqual(await cart.getGrandTotal(), maximumPrice)).toBeTruthy();
  });
});

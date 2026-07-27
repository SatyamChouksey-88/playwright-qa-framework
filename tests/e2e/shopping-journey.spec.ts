import { test, expect } from '../../src/fixtures/test-fixtures';
import { pricesEqual, roundCurrency } from '../../src/utils/currency.util';
import { CartLineValidation } from '../../src/types/product.types';

test.describe('E2E — Shopping journeys', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.gotoProducts();
  });

  test('TC-E2E-003: filter, add, remove, and end with an empty cart', async ({
    productsPage,
    productsApi,
    filter,
    cart,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    const expectedAfterFilter = apiProducts.filter((p) => p.availableSizes.includes('L')).length;

    await filter.toggleSize('L');
    await productsPage.waitForProductCount(expectedAfterFilter);

    const [product] = await productsPage.getAllCatalogProducts();
    await productsPage.addProductToCart(product.title);
    expect(await cart.getTotalQuantity()).toBe(1);

    await cart.removeLine(product.title);
    expect(await cart.getTotalQuantity()).toBe(0);
    expect(await cart.getGrandTotal()).toBe(0);
  });

  test('TC-E2E-004: multi-product journey with quantity changes reconciles the grand total', async ({
    productsPage,
    cart,
  }) => {
    const catalog = await productsPage.getAllCatalogProducts();
    const [first, second] = catalog;

    await productsPage.addProductToCart(first.title);
    await productsPage.addProductToCart(second.title);
    await cart.increaseQuantity(first.title);

    const expectedLines: CartLineValidation[] = [
      {
        title: first.title,
        unitPrice: first.price,
        quantity: 2,
        subtotal: roundCurrency(first.price * 2),
      },
      {
        title: second.title,
        unitPrice: second.price,
        quantity: 1,
        subtotal: second.price,
      },
    ];

    await cart.validateCartMath(expectedLines);
  });

  test('TC-E2E-005: filtering, adding, clearing the filter, and adding again keeps both lines', async ({
    productsPage,
    productsApi,
    filter,
    cart,
  }) => {
    const apiProducts = await productsApi.fetchProducts();
    const expectedAfterFilter = apiProducts.filter((p) => p.availableSizes.includes('S')).length;
    expect(expectedAfterFilter).toBeLessThan(apiProducts.length);

    await filter.toggleSize('S');
    await productsPage.waitForProductCount(expectedAfterFilter);

    const filtered = await productsPage.getAllCatalogProducts();
    const filteredProduct = filtered[0];
    await productsPage.addProductToCart(filteredProduct.title);

    await filter.toggleSize('S');
    await productsPage.waitForProductCount(apiProducts.length);

    const full = await productsPage.getAllCatalogProducts();
    const secondProduct = full.find((p) => p.title !== filteredProduct.title);
    expect(secondProduct).toBeDefined();
    await productsPage.addProductToCart(secondProduct!.title);

    const lines = await cart.getAllLineDetails();
    expect(lines).toHaveLength(2);
    expect(await cart.getTotalQuantity()).toBe(2);
    expect(
      pricesEqual(
        await cart.getGrandTotal(),
        roundCurrency(filteredProduct.price + secondProduct!.price)
      )
    ).toBeTruthy();
  });

  test('TC-E2E-006: a complete purchase journey ends at the checkout confirmation', async ({
    page,
    productsPage,
    cart,
  }) => {
    const catalog = await productsPage.getAllCatalogProducts();
    const [first, second] = catalog;

    await productsPage.addProductToCart(first.title);
    await productsPage.addProductToCart(second.title);

    const expectedTotal = roundCurrency(first.price + second.price);
    expect(pricesEqual(await cart.getGrandTotal(), expectedTotal)).toBeTruthy();

    const dialogMessage = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    await cart.openCart();
    await cart.checkoutButton.click();

    const message = await dialogMessage;
    expect(message).toContain('Checkout');
    const alertAmount = Number.parseFloat(message.match(/(\d+\.\d{2})/)?.[1] ?? 'NaN');
    expect(pricesEqual(alertAmount, expectedTotal)).toBeTruthy();
  });
});

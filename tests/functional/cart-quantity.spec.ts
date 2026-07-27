import { test, expect } from '../../src/fixtures/test-fixtures';
import { pricesEqual, roundCurrency } from '../../src/utils/currency.util';

test.describe('Functional — Cart quantity operations', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.gotoProducts();
  });

  test('TC-CART-005: increasing quantity updates line quantity and grand total', async ({
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();
    await productsPage.addProductToCart(product.title);

    await cart.increaseQuantity(product.title);

    const line = await cart.getLineDetails(product.title);
    expect(line.quantity).toBe(2);
    expect(pricesEqual(line.unitPrice, product.price)).toBeTruthy();

    const grandTotal = await cart.getGrandTotal();
    expect(pricesEqual(grandTotal, roundCurrency(product.price * 2))).toBeTruthy();
  });

  test('TC-CART-006: decreasing after increasing returns to original quantity and total', async ({
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();
    await productsPage.addProductToCart(product.title);

    await cart.increaseQuantity(product.title);
    expect((await cart.getLineDetails(product.title)).quantity).toBe(2);

    await cart.decreaseQuantity(product.title);

    const line = await cart.getLineDetails(product.title);
    expect(line.quantity).toBe(1);
    expect(pricesEqual(await cart.getGrandTotal(), product.price)).toBeTruthy();
  });

  test('TC-CART-007: adding distinct products creates separate cart lines', async ({
    productsPage,
    cart,
  }) => {
    const catalog = await productsPage.getAllCatalogProducts();
    const chosen = catalog.slice(0, 3);

    for (const product of chosen) {
      await productsPage.addProductToCart(product.title);
    }

    const lines = await cart.getAllLineDetails();
    expect(lines).toHaveLength(chosen.length);

    for (const product of chosen) {
      const line = await cart.getLineDetails(product.title);
      expect(line.quantity).toBe(1);
      expect(pricesEqual(line.unitPrice, product.price)).toBeTruthy();
    }
  });

  test('TC-CART-008: cart badge equals the sum of all line quantities', async ({
    productsPage,
    cart,
  }) => {
    const catalog = await productsPage.getAllCatalogProducts();
    const first = catalog[0];
    const second = catalog[1];

    await productsPage.addProductToCart(first.title);
    await productsPage.addProductToCart(first.title);
    await productsPage.addProductToCart(second.title);

    const lines = await cart.getAllLineDetails();
    const expectedQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);

    expect(expectedQuantity).toBe(3);
    expect(await cart.getTotalQuantity()).toBe(expectedQuantity);
  });

  test('TC-CART-009: checkout alert reports the same subtotal shown in the cart footer', async ({
    page,
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();
    await productsPage.addProductToCart(product.title);

    const footerTotal = await cart.getGrandTotal();

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
    const alertAmount = Number.parseFloat(message.match(/(\d+\.\d{2})/)?.[1] ?? 'NaN');

    expect(pricesEqual(alertAmount, footerTotal)).toBeTruthy();
  });
});

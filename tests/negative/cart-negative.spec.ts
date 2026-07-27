import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('Negative — Cart edge cases', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.gotoProducts();
  });

  test('TC-NEG-001: checkout with empty cart shows a guidance alert', async ({ page, cart }) => {
    const dialogMessage = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    await cart.openCart();
    await cart.checkoutButton.click();

    expect(await dialogMessage).toContain('Add some product');
  });

  test('TC-NEG-002: decrease button is disabled at quantity 1', async ({
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();
    await productsPage.addProductToCart(product.title);
    await cart.openCart();

    const minusButton = cart.lineItemByTitle(product.title).getByText('-', { exact: true });
    await expect(minusButton).toBeDisabled();
  });

  test('TC-NEG-003: a fresh session starts with an empty cart badge', async ({ cart }) => {
    expect(await cart.getTotalQuantity()).toBe(0);
  });

  test('TC-NEG-004: removing the only line leaves the cart empty and re-addable', async ({
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();

    await productsPage.addProductToCart(product.title);
    await cart.removeLine(product.title);
    expect(await cart.getTotalQuantity()).toBe(0);

    await productsPage.addProductToCart(product.title);
    expect(await cart.getTotalQuantity()).toBe(1);
  });

  test('TC-NEG-005: closing the cart drawer preserves its contents', async ({
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();
    await productsPage.addProductToCart(product.title);

    await cart.openCart();
    await cart.closeCartIfOpen();
    await expect(cart.cartHeader).toBeHidden();

    await cart.openCart();
    const line = await cart.getLineDetails(product.title);
    expect(line.quantity).toBe(1);
  });

  test('TC-NEG-006: adding the same product repeatedly never creates duplicate lines', async ({
    productsPage,
    cart,
  }) => {
    const [product] = await productsPage.getAllCatalogProducts();

    for (let i = 0; i < 3; i++) {
      await productsPage.addProductToCart(product.title);
    }

    const lines = await cart.getAllLineDetails();
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });
});

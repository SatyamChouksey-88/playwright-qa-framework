import { Page, Locator, expect } from '@playwright/test';
import { CartLineValidation } from '../types/product.types';
import { parseCurrency, pricesEqual, roundCurrency } from '../utils/currency.util';
import { SELECTORS } from './selectors';

export class CartComponent {
  readonly page: Page;
  readonly cartQuantityBadge: Locator;
  readonly cartHeader: Locator;
  readonly subtotalLabel: Locator;
  readonly checkoutButton: Locator;
  readonly removeButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartQuantityBadge = page.locator(SELECTORS.cartQuantityBadge);
    this.cartHeader = page.getByText('Cart', { exact: true });
    this.subtotalLabel = page.getByText('SUBTOTAL', { exact: true });
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.removeButton = page.locator(SELECTORS.removeFromCart);
    this.closeButton = page.locator('button').filter({ hasText: /^X$/ });
  }

  /**
   * Exact-text match on purpose: `hasText` substring-matches case-insensitively,
   * which would make "Blue T-Shirt" also select the "Marine Blue T-shirt" line.
   */
  lineItemByTitle(title: string): Locator {
    return this.removeButton
      .locator('xpath=..')
      .filter({ has: this.page.getByText(title, { exact: true }) });
  }

  private parseUnitPriceFromLineText(text: string): number {
    const allPrices = [...text.matchAll(/\$\s*(\d+\.\d{2})/g)].map((m) =>
      Number.parseFloat(m[1])
    );
    if (allPrices.length === 0) return 0;
    return Math.max(...allPrices);
  }

  async openCart(): Promise<void> {
    if (await this.cartHeader.isVisible()) return;
    await this.cartQuantityBadge.first().click();
    await this.cartHeader.waitFor({ state: 'visible' });
  }

  async closeCartIfOpen(): Promise<void> {
    if (await this.closeButton.isVisible()) {
      await this.closeButton.click();
      await this.cartHeader.waitFor({ state: 'hidden' });
    }
  }

  async getTotalQuantity(): Promise<number> {
    await this.closeCartIfOpen();
    const text = await this.cartQuantityBadge.first().textContent();
    return Number.parseInt(text?.trim() ?? '0', 10);
  }

  async getGrandTotal(): Promise<number> {
    await this.openCart();
    const footerText = await this.subtotalLabel.locator('xpath=ancestor::div[1]').innerText();
    const match = footerText.match(/\$\s*\d+\.\d{2}/);
    return parseCurrency(match?.[0] ?? '0');
  }

  async getLineDetails(title: string): Promise<CartLineValidation> {
    await this.openCart();
    const line = this.lineItemByTitle(title);
    await expect(line).toBeVisible();

    const text = (await line.innerText()) ?? '';
    const qtyMatch = text.match(/Quantity:\s*(\d+)/);

    const unitPrice = this.parseUnitPriceFromLineText(text);
    const quantity = Number.parseInt(qtyMatch?.[1] ?? '1', 10);

    return {
      title,
      unitPrice,
      quantity,
      subtotal: roundCurrency(unitPrice * quantity),
    };
  }

  async getAllLineDetails(): Promise<CartLineValidation[]> {
    await this.openCart();
    const count = await this.removeButton.count();
    const lines: CartLineValidation[] = [];

    for (let i = 0; i < count; i++) {
      const line = this.removeButton.nth(i).locator('xpath=..');
      const text = (await line.innerText()) ?? '';
      const titlePart = text.split('Quantity:')[0] ?? '';
      const title = titlePart.split('|')[0]?.trim() ?? '';
      const qtyMatch = text.match(/Quantity:\s*(\d+)/);
      const unitPrice = this.parseUnitPriceFromLineText(text);
      const quantity = Number.parseInt(qtyMatch?.[1] ?? '1', 10);

      if (title) {
        lines.push({
          title,
          unitPrice,
          quantity,
          subtotal: roundCurrency(unitPrice * quantity),
        });
      }
    }

    return lines;
  }

  async increaseQuantity(title: string): Promise<void> {
    await this.openCart();
    const line = this.lineItemByTitle(title);
    await line.getByText('+', { exact: true }).click();
  }

  async decreaseQuantity(title: string): Promise<void> {
    await this.openCart();
    const line = this.lineItemByTitle(title);
    await line.getByText('-', { exact: true }).click();
  }

  async removeLine(title: string): Promise<void> {
    await this.openCart();
    await this.lineItemByTitle(title).locator(SELECTORS.removeFromCart).click();
    await this.closeCartIfOpen();
  }

  async validateCartMath(expectedLines: CartLineValidation[]): Promise<void> {
    const expectedQty = expectedLines.reduce((sum, l) => sum + l.quantity, 0);
    const expectedTotal = roundCurrency(
      expectedLines.reduce((sum, l) => sum + l.subtotal, 0)
    );

    await this.closeCartIfOpen();
    const actualQty = await this.getTotalQuantity();
    const actualTotal = await this.getGrandTotal();

    expect(actualQty).toBe(expectedQty);
    expect(pricesEqual(actualTotal, expectedTotal)).toBeTruthy();
  }
}

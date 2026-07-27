import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { CatalogProduct } from '../types/product.types';
import { parseCurrency } from '../utils/currency.util';
import { SELECTORS } from './selectors';
import { getEnvConfig } from '../../config/env';

export class ProductsPage extends BasePage {
  readonly productCard: Locator;
  readonly addToCartButton: Locator;
  readonly productCountLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.productCard = page
      .locator(SELECTORS.productCard)
      .filter({ has: page.getByRole('button', { name: 'Add to cart' }) });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.productCountLabel = page.getByText(/\d+ Product\(s\) found/);
  }

  async gotoProducts(): Promise<void> {
    const productsLoaded = getEnvConfig().fetchesCatalogOverNetwork
      ? this.page.waitForResponse(
          (resp) => resp.url().includes('products.json') && resp.status() === 200,
          { timeout: 45_000 }
        )
      : Promise.resolve(null);

    await this.goto('/products');
    await productsLoaded;
    await expect
      .poll(async () => this.productCard.count(), { timeout: 45_000 })
      .toBeGreaterThan(0);
  }

  async getProductCountFromLabel(): Promise<number> {
    const text = await this.productCountLabel.textContent();
    const match = text?.match(/(\d+)\s+Product\(s\) found/);
    return Number.parseInt(match?.[1] ?? '0', 10);
  }

  /**
   * Exact-text match on purpose: `hasText` does a case-insensitive substring
   * match, so "Blue T-Shirt" would also select the "Marine Blue T-shirt" card.
   */
  productCardByTitle(title: string): Locator {
    return this.productCard.filter({ has: this.page.getByText(title, { exact: true }) });
  }

  /** Blocks until the catalog has settled on an expected size. */
  async waitForProductCount(expected: number, timeout = 20_000): Promise<void> {
    await expect.poll(async () => this.getProductCountFromLabel(), { timeout }).toBe(expected);
    await expect.poll(async () => this.productCard.count(), { timeout }).toBe(expected);
  }

  addToCartForProduct(title: string): Locator {
    return this.productCardByTitle(title).getByRole('button', { name: 'Add to cart' });
  }

  /**
   * XPath used when chaining from a known title to the sibling price block —
   * no data-testid exists on price elements in this app.
   */
  priceInCardByTitle(title: string): Locator {
    return this.productCardByTitle(title).locator('xpath=.//*[contains(text(),"$")]');
  }

  async getAllCatalogProducts(): Promise<CatalogProduct[]> {
    await expect
      .poll(async () => this.productCard.count(), { timeout: 30_000 })
      .toBeGreaterThan(0);

    // Read every card in one evaluation. Iterating with `nth(i)` re-resolves the
    // locator per index, which races against React re-rendering the grid after
    // a filter change and intermittently throws on a detached node.
    const cardTexts = await this.productCard.evaluateAll((nodes) =>
      nodes
        .filter((node) => (node as HTMLElement).offsetParent !== null)
        .map((node) => (node as HTMLElement).innerText)
    );

    const products: CatalogProduct[] = [];

    for (const cardText of cardTexts) {
      const lines = cardText.split('\n').map((l) => l.trim()).filter(Boolean);
      const title =
        lines.find(
          (l) =>
            !l.includes('$') &&
            l !== 'Add to cart' &&
            l !== 'Free shipping' &&
            !l.startsWith('or ')
        ) ?? '';
      const priceText = cardText.match(/\$\s*\d+\.\d{2}/)?.[0] ?? '';
      if (title && priceText) {
        products.push({
          title,
          priceText,
          price: parseCurrency(priceText),
        });
      }
    }

    return products;
  }

  async addProductToCart(title: string): Promise<void> {
    await this.addToCartForProduct(title).click();
    const closeBtn = this.page.locator('button').filter({ hasText: /^X$/ });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  /** Navigates without requiring products to render — for empty/error catalogs. */
  async gotoProductsExpectingNoCatalog(): Promise<void> {
    await this.goto('/products');
    await expect(this.productCountLabel).toBeVisible({ timeout: 30_000 });
  }

  freeShippingBadgeInCard(title: string): Locator {
    return this.productCardByTitle(title).getByText('Free shipping', { exact: true });
  }

  installmentTextInCard(title: string): Locator {
    return this.productCardByTitle(title).getByText(/^or \d+ x/);
  }
}

import { Page, Locator, expect } from '@playwright/test';
import { countMatchingRequests } from '../utils/network.util';
import { SELECTORS } from './selectors';
import { getEnvConfig } from '../../config/env';

export class FilterComponent {
  readonly page: Page;
  readonly sizeCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sizeCheckbox = page.locator(SELECTORS.sizeCheckbox);
  }

  sizeLabel(size: string): Locator {
    return this.page.getByText(size, { exact: true });
  }

  /**
   * The native input is covered by a styled span, so the label text is the
   * clickable target.
   *
   * The app rebuilds its selected-size Set from the `filters` prop on every
   * render and each toggle re-fetches products.json. Clicking again before that
   * round-trip commits makes the component read a stale Set and silently drop
   * the previous selection, so a toggle is not complete until the refetch has
   * landed and the rendered count has stopped moving.
   */
  async toggleSize(size: string): Promise<void> {
    const checkbox = this.checkboxForSize(size);
    const wasChecked = await checkbox.isChecked();

    const refetch = getEnvConfig().fetchesCatalogOverNetwork
      ? this.page
          .waitForResponse((response) => response.url().includes('products.json'), {
            timeout: 20_000,
          })
          .catch(() => null)
      : Promise.resolve(null);

    await this.sizeLabel(size).click();
    await refetch;

    await expect.poll(async () => checkbox.isChecked(), { timeout: 10_000 }).toBe(!wasChecked);
    await this.waitForCatalogSettled();
  }

  /** Waits until the rendered product count stops changing. */
  private async waitForCatalogSettled(timeout = 15_000): Promise<void> {
    const readCount = async (): Promise<number> =>
      this.page.locator(SELECTORS.productCard).count();

    let previous = -1;
    await expect
      .poll(
        async () => {
          const current = await readCount();
          const stable = current === previous;
          previous = current;
          return stable;
        },
        { timeout, intervals: [250] }
      )
      .toBe(true);
  }

  async getVisibleSizes(): Promise<string[]> {
    const checkboxes = this.sizeCheckbox;
    const count = await checkboxes.count();
    const sizes: string[] = [];
    for (let i = 0; i < count; i++) {
      const value = await checkboxes.nth(i).getAttribute('value');
      if (value) sizes.push(value);
    }
    return sizes;
  }

  async countProductFetchRequestsDuringToggle(size: string): Promise<number> {
    return countMatchingRequests(this.page, /products\.json/, () => this.toggleSize(size));
  }

  checkboxForSize(size: string): Locator {
    return this.page.locator(`${SELECTORS.sizeCheckbox}[value="${size}"]`);
  }

  async isSizeChecked(size: string): Promise<boolean> {
    return this.checkboxForSize(size).isChecked();
  }

  async getCheckedSizes(): Promise<string[]> {
    const all = await this.getVisibleSizes();
    const checked: string[] = [];
    for (const size of all) {
      if (await this.isSizeChecked(size)) checked.push(size);
    }
    return checked;
  }

  async selectSizes(sizes: string[]): Promise<void> {
    for (const size of sizes) {
      await this.toggleSize(size);
    }
  }
}

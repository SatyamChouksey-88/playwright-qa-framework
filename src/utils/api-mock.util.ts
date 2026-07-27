import { Page, test } from '@playwright/test';
import { getEnvConfig } from '../../config/env';
import { Product } from '../types/product.types';

/**
 * Skips a test that depends on intercepting the catalog request.
 *
 * A local `react-scripts start` build resolves its catalog from a bundled JSON
 * module and never issues a request, so `page.route` has nothing to intercept
 * and any assertion about catalog network traffic is vacuous there.
 */
export function skipUnlessCatalogIsNetworked(): void {
  const { envName, fetchesCatalogOverNetwork } = getEnvConfig();
  test.skip(
    !fetchesCatalogOverNetwork,
    `The ${envName} build bundles its catalog, so there is no request to intercept`
  );
}

/** Glob that matches the products endpoint on every supported environment. */
export const PRODUCTS_ROUTE_GLOB = '**/products.json';

/**
 * Intercepts the products endpoint and serves the supplied catalog.
 * Centralised so no spec repeats the route glob or the fulfil boilerplate.
 */
export async function mockProductsCatalog(
  page: Page,
  products: Product[],
  options: { status?: number; delayMs?: number } = {}
): Promise<void> {
  const { status = 200, delayMs = 0 } = options;

  await page.route(PRODUCTS_ROUTE_GLOB, async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ products }),
    });
  });
}

/** Serves a non-2xx response so error handling can be exercised. */
export async function mockProductsFailure(page: Page, status: number): Promise<void> {
  await page.route(PRODUCTS_ROUTE_GLOB, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: '{"error":"failed"}' })
  );
}

/** Serves a syntactically invalid body to exercise parse-failure handling. */
export async function mockProductsMalformed(page: Page): Promise<void> {
  await page.route(PRODUCTS_ROUTE_GLOB, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"products": [' })
  );
}

/** Resolves the products endpoint for the active environment. */
export function productsApiUrl(): string {
  return getEnvConfig().productsApiUrl;
}

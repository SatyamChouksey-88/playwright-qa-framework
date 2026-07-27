import { Product } from '../types/product.types';

/**
 * Clones a real catalog product, overriding only the supplied fields.
 * The `sku` is deliberately preserved: the app resolves product imagery with
 * `require(static/products/${sku}-1-product.webp)`, so an invented SKU crashes
 * the bundle at render time.
 */
export function cloneProductWith(base: Product, overrides: Partial<Product>): Product {
  return { ...base, ...overrides, sku: base.sku };
}

export function filterProductsByPrices(
  products: Product[],
  targetPrices: number[]
): Product[] {
  return products.filter((p) =>
    targetPrices.some((target) => Math.abs(p.price - target) < 0.001)
  );
}

export function excludeProductsByPrices(
  products: Product[],
  excludedPrices: number[]
): Product[] {
  return products.filter(
    (p) => !excludedPrices.some((excluded) => Math.abs(p.price - excluded) < 0.001)
  );
}

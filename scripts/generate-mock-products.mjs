/**
 * One-time generator for test-data/mock-products-100.json.
 *
 * Run with: node scripts/generate-mock-products.mjs
 *
 * The output file is committed so specs read externalized static data rather
 * than regenerating a payload at runtime. Re-run this only when the upstream
 * catalog shape changes.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '..', 'test-data', 'mock-products-100.json');
const SOURCE_API = 'https://react-shopping-cart-67954.firebaseio.com/products.json';
const TARGET_COUNT = 100;

const response = await fetch(SOURCE_API);
if (!response.ok) {
  throw new Error(`Source API returned ${response.status}`);
}

const { products: base } = await response.json();

const products = Array.from({ length: TARGET_COUNT }, (_, index) => {
  const template = base[index % base.length];
  return {
    ...template,
    id: index,
    title: `${template.title} #${index + 1}`,
  };
});

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify({ products }, null, 2)}\n`);

console.log(`Wrote ${products.length} products to ${OUTPUT_PATH}`);

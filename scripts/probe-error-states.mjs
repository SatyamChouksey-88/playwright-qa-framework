import { chromium } from '@playwright/test';

const BASE = 'https://react-shopping-cart-67954.firebaseapp.com/products';
const GLOB = '**/products.json';

async function probe(label, routeHandler) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.route(GLOB, routeHandler);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const bodyText = await page.evaluate(() => document.body.innerText);
  const countLabel = bodyText.match(/\d+ Product\(s\) found/)?.[0] ?? 'NONE';
  const hasSizesHeading = bodyText.includes('Sizes:');
  const cards = await page.locator('div[tabindex="1"]').count();
  const spinner = await page.locator('.sk-cube-grid, [class*="spinner"], [class*="loader"]').count();

  console.log(JSON.stringify({
    label,
    countLabel,
    hasSizesHeading,
    cards,
    spinner,
    pageErrors: pageErrors.slice(0, 3),
    bodySnippet: bodyText.replace(/\s+/g, ' ').slice(0, 200),
  }, null, 2));

  await browser.close();
}

await probe('empty-catalog', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products: [] }) })
);

await probe('http-500', (route) =>
  route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' })
);

await probe('malformed-json', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: '{"products": [' })
);

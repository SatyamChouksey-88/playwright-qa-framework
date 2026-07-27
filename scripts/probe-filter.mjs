import { chromium } from '@playwright/test';

const BASE = 'https://react-shopping-cart-67954.firebaseapp.com/products';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('div[tabindex="1"]');

const label = () =>
  page.evaluate(() => document.body.innerText.match(/(\d+) Product\(s\) found/)?.[1] ?? '?');
const cardCount = () => page.locator('div[tabindex="1"]').count();
const visibleCards = () => page.locator('div[tabindex="1"]').filter({ visible: true }).count();
const checkedBoxes = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="checkbox"]')]
      .filter((c) => c.checked)
      .map((c) => c.value)
  );

console.log('initial  label=%s cards=%s visible=%s', await label(), await cardCount(), await visibleCards());

for (const size of ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL']) {
  await page.getByText(size, { exact: true }).click();
  await page.waitForTimeout(700);
  console.log(
    'after +%s  label=%s cards=%s visible=%s checked=%s',
    size.padEnd(3),
    await label(),
    await cardCount(),
    await visibleCards(),
    JSON.stringify(await checkedBoxes())
  );
}

// Reset, then test the L filter that TC-E2E-002 uses.
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('div[tabindex="1"]');
await page.getByText('L', { exact: true }).click();
await page.waitForTimeout(1500);
console.log('\nL filter: label=%s cards=%s visible=%s', await label(), await cardCount(), await visibleCards());

const titles = await page.evaluate(() =>
  [...document.querySelectorAll('div[tabindex="1"]')].map((c) => ({
    text: c.innerText.replace(/\n/g, ' | '),
    visible: c.offsetParent !== null,
  }))
);
titles.forEach((t, i) => console.log(i, t.visible ? 'VIS' : 'HID', t.text.slice(0, 70)));

await browser.close();

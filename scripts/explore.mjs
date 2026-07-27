import { chromium } from '@playwright/test';

const BASE = 'https://react-shopping-cart-67954.firebaseapp.com';

async function explore() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const networkRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('product') || req.url().includes('firebaseio')) {
      networkRequests.push({ method: req.method(), url: req.url() });
    }
  });

  await page.goto(`${BASE}/products`, { waitUntil: 'networkidle' });

  const title = await page.title();
  const url = page.url();

  const testIds = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid]')].map((el) => ({
      testid: el.getAttribute('data-testid'),
      tag: el.tagName,
      text: el.textContent?.trim().slice(0, 50),
    }))
  );

  const productCards = await page.locator('button:has-text("Add to cart")').count();
  const productInfo = await page.evaluate(() => {
    const cards = [];
    document.querySelectorAll('button').forEach((btn) => {
      if (btn.textContent?.trim() === 'Add to cart') {
        let parent = btn.parentElement;
        while (parent && !parent.querySelector('h1, p, span')) parent = parent.parentElement;
        const container = btn.closest('div[tabindex]') || btn.parentElement?.parentElement;
        const titleEl = container?.querySelector('p, h1, span');
        const allText = container?.textContent || '';
        const priceMatch = allText.match(/\$\d+\.\d+/);
        cards.push({
          title: titleEl?.textContent?.trim(),
          priceText: priceMatch?.[0],
          html: container?.outerHTML?.slice(0, 300),
        });
      }
    });
    return cards;
  });

  const prices1090 = productInfo.filter((p) => p.priceText === '$10.90');
  const prices1490 = productInfo.filter((p) => p.priceText === '$14.90');

  const filterRequestsBefore = networkRequests.length;
  const checkbox = page.getByTestId('checkbox').first();
  await checkbox.click();
  await page.waitForTimeout(500);
  const filterRequestsAfter = networkRequests.length;

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.waitForTimeout(500);

  const cartOpen = await page.getByText('Cart', { exact: true }).isVisible().catch(() => false);
  const cartQty = await page.locator('[title="Products in cart quantity"]').first().textContent().catch(() => null);
  const subtotal = await page.getByText('SUBTOTAL').isVisible().catch(() => false);

  const cartLineItems = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('[title="remove product from cart"]').forEach((btn) => {
      const container = btn.closest('div');
      const root = container?.parentElement;
      items.push({
        text: root?.textContent?.trim().slice(0, 200),
        hasPlus: !!root?.querySelector('button, span')?.textContent?.includes('+'),
      });
    });
    return items;
  });

  const domStructure = await page.evaluate(() => {
    const result = {};
    const addBtn = document.querySelector('button');
    const cartBtn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cart') || b.querySelector('[title="Products in cart quantity"]')
    );
    return {
      addToCartButtons: document.querySelectorAll('button').length,
      checkboxes: document.querySelectorAll('[data-testid="checkbox"]').length,
      productCountText: document.body.innerText.match(/\d+ Product\(s\) found/)?.[0],
    };
  });

  console.log(JSON.stringify({
    title,
    url,
    networkRequests,
    testIds,
    productCards,
    prices1090Count: prices1090.length,
    prices1490Count: prices1490.length,
    prices1090,
    prices1490,
    filterNetworkDelta: filterRequestsAfter - filterRequestsBefore,
    cartOpen,
    cartQty,
    subtotal,
    cartLineItems,
    domStructure,
  }, null, 2));

  await browser.close();
}

explore().catch(console.error);

import { Page, Request } from '@playwright/test';

export async function countMatchingRequests(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
): Promise<number> {
  const requests: Request[] = [];
  const handler = (req: Request) => {
    const url = req.url();
    const matches =
      typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
    if (matches) requests.push(req);
  };

  page.on('request', handler);
  await action();
  page.off('request', handler);
  return requests.length;
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

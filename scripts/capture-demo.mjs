/**
 * Produces the screenshots under docs/demo/.
 *
 * The HTML report shots are true browser screenshots of the live report served
 * by `npx playwright show-report` on 127.0.0.1:9323.
 *
 * The terminal shots render the *real* captured stdout from
 * docs/demo/suite-run.txt and docs/demo/folder-structure.txt into a terminal
 * style page, because a headless agent cannot photograph a terminal window.
 * The text is verbatim; only the presentation is synthesised.
 *
 * Usage:
 *   npx playwright show-report --host 127.0.0.1 --port 9323   # terminal 1
 *   node scripts/capture-demo.mjs                             # terminal 2
 */
import { chromium } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = resolve(__dirname, '..', 'docs', 'demo');
const REPORT_URL = 'http://127.0.0.1:9323';

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** PowerShell's `Tee-Object` writes UTF-16LE, so sniff the BOM before decoding. */
function readText(path) {
  const buffer = readFileSync(path);
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.slice(2).toString('utf16le');
  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

function terminalPage(title, command, body) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #12141c; font-family: 'Cascadia Code', 'Consolas', monospace; }
  .window { margin: 24px; border-radius: 10px; overflow: hidden; box-shadow: 0 18px 50px rgba(0,0,0,.6); }
  .bar { background: #23262f; padding: 10px 14px; display: flex; align-items: center; gap: 8px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .bar span.t { color: #b9bfd0; font-size: 13px; margin-left: 10px; }
  .body { background: #0d1017; padding: 18px 20px; color: #d7dce8; font-size: 13px; line-height: 1.55; white-space: pre-wrap; }
  .cmd { color: #7ee787; font-weight: 600; }
  .ok { color: #56d364; }
  .fail { color: #ff7b72; }
  .dim { color: #8b949e; }
</style></head><body>
<div class="window">
  <div class="bar">
    <div class="dot" style="background:#ff5f57"></div>
    <div class="dot" style="background:#febc2e"></div>
    <div class="dot" style="background:#28c840"></div>
    <span class="t">${escapeHtml(title)}</span>
  </div>
  <div class="body"><span class="cmd">PS&gt; ${escapeHtml(command)}</span>
${body}</div>
</div>
</body></html>`;
}

const highlight = (text) =>
  escapeHtml(text)
    .replace(/^(\s*)(ok\b.*)$/gm, '$1<span class="ok">$2</span>')
    .replace(/^(\s*)(\d+\s+passed.*)$/gm, '$1<span class="ok">$2</span>')
    .replace(/^(\s*)(\d+\s+(?:failed|flaky).*)$/gm, '$1<span class="fail">$2</span>')
    .replace(/^(\s*)(\d+\s+skipped.*)$/gm, '$1<span class="dim">$2</span>');

const browser = await chromium.launch();

// 1 + 2. The HTML report, as served.
const reportPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  await reportPage.goto(REPORT_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await reportPage.waitForTimeout(2500);
  await reportPage.screenshot({
    path: resolve(DEMO_DIR, '02-html-report-overview.png'),
    fullPage: false,
  });
  console.log('wrote 02-html-report-overview.png');

  const firstTest = reportPage.locator('a[href*="testId="]').first();
  if (await firstTest.count()) {
    await firstTest.click();
    await reportPage.waitForTimeout(2000);
    await reportPage.screenshot({
      path: resolve(DEMO_DIR, '03-html-report-test-detail.png'),
      fullPage: false,
    });
    console.log('wrote 03-html-report-test-detail.png');
  }
} catch (error) {
  console.warn(`Report screenshots skipped: ${error.message}`);
  console.warn('Start it first: npx playwright show-report --host 127.0.0.1 --port 9323');
}

// 3. The suite run, from real captured stdout.
const runPath = resolve(DEMO_DIR, 'suite-run.txt');
if (existsSync(runPath)) {
  // Strip the PowerShell/npm wrapper noise so the screenshot shows the run,
  // not the shell. Nothing Playwright emitted is altered.
  const NOISE =
    /^(node\.exe :|At line|\+|npm warn|> playwright-qa-framework|> playwright test|\(node:\d+\)|\(Use `node|CategoryInfo|FullyQualifiedErrorId)/;
  const lines = readText(runPath)
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => !NOISE.test(l.trim()));

  const header = lines.find((l) => /^Running \d+ tests/.test(l.trim())) ?? '';
  const okLines = lines.filter((l) => /^\s*ok \d+/.test(l));
  const summary = lines.filter((l) => /\d+ (passed|failed|skipped)/.test(l));
  const shown = 14;
  const excerpt = [
    header,
    '',
    ...okLines.slice(0, shown),
    '',
    `  ... ${okLines.length - shown} further result lines elided for this screenshot ` +
      `(full log: docs/demo/suite-run.txt) ...`,
    '',
    ...summary,
  ]
    .join('\n')
    .trimEnd();

  const page = await browser.newPage({ viewport: { width: 1680, height: 640 } });
  await page.setContent(
    terminalPage('playwright-qa-framework — full suite', 'npm test', highlight(excerpt))
  );
  await page.screenshot({ path: resolve(DEMO_DIR, '01-suite-run.png'), fullPage: true });
  console.log('wrote 01-suite-run.png');
  await page.close();
}

// 4. The folder structure.
const treePath = resolve(DEMO_DIR, 'folder-structure.txt');
if (existsSync(treePath)) {
  // Only trailing whitespace is stripped - the leading box-drawing characters
  // are the tree's indentation and must survive.
  const entries = readText(treePath)
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter(Boolean);

  const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } });
  await page.setContent(
    terminalPage(
      'playwright-qa-framework — structure',
      'node scripts/print-tree.mjs',
      escapeHtml(entries.join('\n'))
    )
  );
  await page.screenshot({ path: resolve(DEMO_DIR, '04-folder-structure.png'), fullPage: true });
  console.log('wrote 04-folder-structure.png');
  await page.close();
}

await browser.close();

/**
 * Fails if any committed text file contains mojibake.
 *
 * Several docs were written through a PowerShell pipeline that re-encoded UTF-8
 * punctuation into replacement sequences, so this guards against a silent repeat.
 *
 * Usage: node scripts/check-encoding.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/** This file necessarily contains the very sequences it searches for. */
const SELF = basename(fileURLToPath(import.meta.url));

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.ts',
  '.tsx',
  '.json',
  '.yml',
  '.yaml',
  '.mjs',
  '.cjs',
  '.env',
  '.example',
  '.txt',
]);

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'playwright-report',
  'test-results',
  'blob-report',
  'all-blob-reports',
]);

const MOJIBAKE = /\uFFFD|Ã¢|â€|Î“|Ã‚|ÃÂ|Ã¯Â»Â¿/g;

const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (entry === SELF) continue;
    if (!TEXT_EXTENSIONS.has(extname(entry)) && !entry.startsWith('.env')) continue;

    const matches = readFileSync(full, 'utf8').match(MOJIBAKE);
    if (matches) {
      findings.push(`${full} -> ${[...new Set(matches)].join(' ')}`);
    }
  }
}

walk('.');

if (findings.length > 0) {
  console.error(`Encoding corruption in ${findings.length} file(s):`);
  findings.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

console.log('No encoding corruption found.');

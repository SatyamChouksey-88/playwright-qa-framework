/**
 * Prints the project tree used in PROJECT_STRUCTURE.md.
 *
 * Windows `tree` has no exclude flag and Unix `tree -I node_modules` is not
 * installed everywhere, so this keeps the doc regenerable on any machine with
 * just Node.
 *
 * Usage: node scripts/print-tree.mjs [rootDir]
 */
import { readdirSync, statSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? '.');

const SKIP = new Set([
  'node_modules',
  '.git',
  'playwright-report',
  'test-results',
  'blob-report',
  'all-blob-reports',
]);

function walk(dir, prefix = '') {
  const entries = readdirSync(dir)
    .filter((entry) => !SKIP.has(entry))
    .map((entry) => ({ name: entry, isDir: statSync(join(dir, entry)).isDirectory() }))
    .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    console.log(`${prefix}${isLast ? '└── ' : '├── '}${entry.name}${entry.isDir ? '/' : ''}`);
    if (entry.isDir) {
      walk(join(dir, entry.name), prefix + (isLast ? '    ' : '│   '));
    }
  });
}

console.log(`${basename(ROOT)}/`);
walk(ROOT);

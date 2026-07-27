import { defineConfig, devices } from '@playwright/test';
import { getEnvConfig } from './config/env';

const env = getEnvConfig();
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // `html` is emitted in CI too: Azure publishes playwright-report/ directly
  // (it does not shard), while GitHub merges the per-shard blob reports into a
  // single HTML artifact. Emitting both keeps either pipeline from publishing a
  // directory that was never generated.
  reporter: isCI
    ? [
        ['list'],
        ['blob', { outputDir: 'blob-report' }],
        ['junit', { outputFile: 'junit-results.xml' }],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],
  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

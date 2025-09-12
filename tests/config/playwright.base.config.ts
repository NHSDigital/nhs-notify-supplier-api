import type { PlaywrightTestConfig } from '@playwright/test';

const baseUrl = process.env.NHSD_APIM_PROXY_URL || 'http://localhost:3000/';
const envMaxInstances = Number.parseInt(process.env.WORKERS_MAX_INST!) || 10;
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export const config: PlaywrightTestConfig = {
  testDir: '../sandbox/messages/get_single_letter/',
  testMatch: '*.spec.ts/',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  workers: envMaxInstances,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: baseUrl,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    /* Slows down Playwright operations by the specified amount of milliseconds. */
    launchOptions: {
      slowMo: 0,
    },
  },
};
export default config;

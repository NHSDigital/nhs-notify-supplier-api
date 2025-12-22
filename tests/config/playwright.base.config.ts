/* eslint-disable radix */
import { PlaywrightTestConfig, defineConfig } from "@playwright/test";
import "dotenv/config";

const envMaxInstances = Number.parseInt(process.env.WORKERS_MAX_INST!) || 10;
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export const config: PlaywrightTestConfig = {
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
};
export default defineConfig(config);

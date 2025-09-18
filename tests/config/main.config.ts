import type { PlaywrightTestConfig } from '@playwright/test';
import { config as baseConfig } from './playwright.base.config';
import {  getReporters } from './reporters';

const localConfig: PlaywrightTestConfig = {
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: getReporters('api-test'),
  ...baseConfig,
  //globalSetup: require.resolve('./setup/globalSetup'),
  //globalTeardown: require.resolve('./setup/globalTeardown'),
  testIgnore: [],
  projects: [
    {
      name: 'sandbox',
      testMatch: 'tests/messages/get_single_letter/*.spec.ts',
    },
  ],
};

export default localConfig;

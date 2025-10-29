import type { PlaywrightTestConfig } from '@playwright/test';
import { config as baseConfig } from './playwright.base.config';
import {  getReporters } from './reporters';
import path from 'path';

const localConfig: PlaywrightTestConfig = {
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: getReporters('api-test'),
  ...baseConfig,
  projects: [
    {
      name: 'sandbox',
      testDir: path.resolve(__dirname, '../sandbox'),
      testMatch: '*.spec.ts',
    },
  ],
};

export default localConfig;

import {defineConfig, PlaywrightTestConfig } from '@playwright/test';
import  baseConfig from './playwright.base.config';
import { getReporters } from './reporters';
import path from 'path';

const localConfig: PlaywrightTestConfig = {
  ...baseConfig,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: getReporters('api-test'),
  projects: [
    {
      name: 'component-tests',
      testDir: path.resolve(__dirname, '../component-tests'),
      testMatch: '**/*.spec.ts',
    },
  ],
};

export default defineConfig(localConfig);

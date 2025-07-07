import type { Config } from 'jest';
import { baseJestConfig } from 'nhs-notify-web-template-management-utils';

const config: Config = {
  ...baseJestConfig,
  testEnvironment: 'node',
};

export default config;

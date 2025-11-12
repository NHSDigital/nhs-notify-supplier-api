import type { ReporterDescription } from '@playwright/test';
import path from 'path';

const resultsDir = process.env.RESULTS_DIR || 'results';
const reportsDir = process.env.REPORTS_DIR || 'reports';

export function getReporters(allureFolder: string) {
  return [
    [
      'allure-playwright',
      {
        outputFolder: `./target/reports/allure-results/${allureFolder}`,
        detail: false,
        suiteTitle: true,
        open: 'always',
        environmentInfo: {
          E2E_NODE_VERSION: process.env.ENVIRONMENT,
          E2E_OS: process.platform,
        },
      },
    ],
    [
      'html',
      {
        outputFolder: path.resolve(__dirname, '../playwright-report'),
        open: process.env.CI ? 'never' : 'on-failure',
      },
    ],
    ['list', { printSteps: true }],
    [
      'junit',
      {
        outputFile: `../target/test-artifacts/${resultsDir}/junit-results.xml`,
      },
    ],
    [
      'json',
      {
        outputFile: `../target/test-artifacts/${resultsDir}/json-results.json`,
      },
    ],
  ] as ReporterDescription[];
}

import type { PlaywrightTestConfig } from "@playwright/test";
import path from "node:path";
import { config as baseConfig } from "../playwright.base.config";
import { getReporters } from "../reporters";

const localConfig: PlaywrightTestConfig = {
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: getReporters("api-test"),
  ...baseConfig,
  globalSetup: path.resolve(__dirname, "./performance-setup.ts"),
  globalTeardown: path.resolve(__dirname, "./performance-teardown.ts"),
  projects: [
    {
      name: "performance",
      testDir: path.resolve(__dirname, "../../performance"),
      testMatch: "*.spec.ts",
    },
  ],
};

export default localConfig;

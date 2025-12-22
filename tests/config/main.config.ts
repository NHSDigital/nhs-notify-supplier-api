import { PlaywrightTestConfig, defineConfig } from "@playwright/test";
import path from "node:path";
import baseConfig from "./playwright.base.config";
import { getReporters } from "./reporters";

const localConfig: PlaywrightTestConfig = {
  ...baseConfig,
  globalSetup: path.resolve(__dirname, "./global-setup.ts"),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: getReporters("api-test"),
  projects: [
    {
      name: "component-tests",
      testDir: path.resolve(__dirname, "../component-tests"),
      testMatch: "**/*.spec.ts",
    },
  ],
};

export default defineConfig(localConfig);

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
      name: "apiGateway-tests",
      testDir: path.resolve(__dirname, "../component-tests/apiGateway-tests"),
      testMatch: "**/*.spec.ts",
    },
    {
      name: "events-tests",
      testDir: path.resolve(__dirname, "../component-tests/events-tests"),
      testMatch: "**/*.spec.ts",
      dependencies: ["apiGateway-tests"],
    },
    {
      name: "letterQueue-tests",
      testDir: path.resolve(__dirname, "../component-tests/letterQueue-tests"),
      testMatch: "**/*.spec.ts",
    },
    {
      name: "integration-tests",
      testDir: path.resolve(__dirname, "../component-tests/integration-tests"),
      testMatch: "**/*.spec.ts",
    },
  ],
};

export default defineConfig(localConfig);

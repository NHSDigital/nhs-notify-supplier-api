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
      name: "integration-tests",
      testDir: path.resolve(__dirname, "../component-tests/integration-tests"),
      testMatch: "**/*.spec.ts",
    },
    {
      name: "apiGateway-tests",
      testDir: path.resolve(__dirname, "../component-tests/apiGateway-tests"),
      testMatch: "**/*.spec.ts",
      dependencies: ["integration-tests"],
    },
    {
      name: "events-tests",
      testDir: path.resolve(__dirname, "../component-tests/events-tests"),
      testMatch: "**/*.spec.ts",
      dependencies: ["apiGateway-tests"],
    },
    {
      name: "allocation-tests",
      testDir: path.resolve(__dirname, "../component-tests/allocation-tests"),
      testMatch: "**/*.spec.ts",
    },
    {
      // Specs that overwrite or assert exact supplier-quotas counters. They run one at a time,
      // after every other project that sends events to the allocator.
      name: "allocation-serial-tests",
      testDir: path.resolve(
        __dirname,
        "../component-tests/allocation-serial-tests",
      ),
      testMatch: "**/*.spec.ts",
      fullyParallel: false,
      workers: 1,
      dependencies: ["allocation-tests", "events-tests"],
    },
    {
      name: "letterQueue-tests", // Needs to run last as tests visibility timeout and can impact other tests if run before them
      testDir: path.resolve(__dirname, "../component-tests/letterQueue-tests"),
      testMatch: "**/*.spec.ts",
      dependencies: ["events-tests"],
    },
  ],
};

export default defineConfig(localConfig);

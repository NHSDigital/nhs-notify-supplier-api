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
      // Specs that call GET /letters as supplier1. GET /letters hides every letter it returns for
      // VISIBILITY_TIMEOUT_SECONDS, so these specs run one at a time to avoid hiding each other's letters.
      name: "letter-list-tests",
      testDir: path.resolve(__dirname, "../component-tests/letter-list-tests"),
      testMatch: "**/*.spec.ts",
      fullyParallel: false,
      workers: 1,
    },
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
  ],
};

export default defineConfig(localConfig);

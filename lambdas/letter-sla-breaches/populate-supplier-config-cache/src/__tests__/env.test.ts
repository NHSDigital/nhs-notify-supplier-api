/* eslint-disable @typescript-eslint/no-require-imports */
/* Allow require imports to enable re-import of modules */

import { ZodError } from "zod";

describe("lambdaEnv", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("loads required and optional environment variables", () => {
    process.env.SUPPLIER_CONFIG_TABLE_NAME = "supplier-config-table";
    process.env.EVENT_CACHE_BUCKET_NAME = "event-cache-bucket";
    process.env.PINO_LOG_LEVEL = "debug";

    const { envVars } = require("../handler/env");

    expect(envVars).toEqual({
      SUPPLIER_CONFIG_TABLE_NAME: "supplier-config-table",
      EVENT_CACHE_BUCKET_NAME: "event-cache-bucket",
      PINO_LOG_LEVEL: "debug",
    });
  });

  it("throws when a required environment variable is missing", () => {
    process.env.SUPPLIER_CONFIG_TABLE_NAME = undefined;
    process.env.EVENT_CACHE_BUCKET_NAME = "event-cache-bucket";

    expect(() => require("../handler/env")).toThrow(ZodError);
  });

  it("allows the optional log level to be unset", () => {
    process.env.SUPPLIER_CONFIG_TABLE_NAME = "supplier-config-table";
    process.env.EVENT_CACHE_BUCKET_NAME = "event-cache-bucket";
    process.env.PINO_LOG_LEVEL = undefined;

    const { envVars } = require("../handler/env");

    expect(envVars.PINO_LOG_LEVEL).toBeUndefined();
  });
});

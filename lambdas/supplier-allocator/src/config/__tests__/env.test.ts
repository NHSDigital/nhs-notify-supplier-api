import { ZodError } from "zod";
/* eslint-disable @typescript-eslint/no-require-imports */
/* Allow require imports to enable re-import of modules */

describe("lambdaEnv", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears cached modules
    process.env = { ...OLD_ENV }; // Clone original env
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore
  });

  it("should load all environment variables successfully", () => {
    process.env.SUPPLIER_CONFIG_TABLE_NAME = "SupplierConfigTable";
    process.env.VARIANT_MAP = `{
      "lv1": {
        "supplierId": "supplier1",
        "specId": "spec1"
      }
    }`;

    const { envVars } = require("../env");

    expect(envVars).toEqual({
      SUPPLIER_CONFIG_TABLE_NAME: "SupplierConfigTable",
      VARIANT_MAP: {
        lv1: {
          supplierId: "supplier1",
          specId: "spec1",
        },
      },
    });
  });

  it("should throw if a required env var is missing", () => {
    process.env.VARIANT_MAP = undefined;

    expect(() => require("../env")).toThrow(ZodError);
  });
});

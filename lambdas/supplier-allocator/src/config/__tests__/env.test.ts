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
    process.env.LETTERS_TABLE_NAME = "letters-table";
    process.env.LETTER_TTL_HOURS = "12960";
    process.env.VARIANT_MAP = `{
      "lv1": {
        "supplierId": "supplier1",
        "specId": "spec1"
      }
    }`;

    const { envVars } = require("../env");

    expect(envVars).toEqual({
      LETTERS_TABLE_NAME: "letters-table",
      LETTER_TTL_HOURS: 12_960,
      VARIANT_MAP: {
        lv1: {
          supplierId: "supplier1",
          specId: "spec1",
        },
      },
    });
  });

  it("should throw if a required env var is missing", () => {
    process.env.LETTERS_TABLE_NAME = "table";
    process.env.LETTER_TTL_HOURS = "12960";
    process.env.VARIANT_MAP = undefined;

    expect(() => require("../env")).toThrow(ZodError);
  });
});

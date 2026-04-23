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
    process.env.SUPPLIER_QUOTAS_TABLE_NAME = "SupplierQuotasTable";

    const { envVars } = require("../env");

    expect(envVars).toEqual({
      SUPPLIER_CONFIG_TABLE_NAME: "SupplierConfigTable",
      SUPPLIER_QUOTAS_TABLE_NAME: "SupplierQuotasTable",
    });
  });
});

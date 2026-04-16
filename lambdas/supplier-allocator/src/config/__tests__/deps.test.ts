import type { Deps } from "lambdas/supplier-allocator/src/config/deps";

describe("createDependenciesContainer", () => {
  const env = {
    SUPPLIER_CONFIG_TABLE_NAME: "SupplierConfigTable",
    SUPPLIER_QUOTAS_TABLE_NAME: "SupplierQuotasTable",
    VARIANT_MAP: {
      lv1: {
        supplierId: "supplier1",
        specId: "spec1",
        billingId: "billing1",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // @internal/helpers - createLogger
    jest.mock("@internal/helpers", () => ({
      createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        level: "info",
      })),
    }));

    // Repo client
    jest.mock("@internal/datastore", () => ({
      SupplierConfigRepository: jest.fn(),
      SupplierQuotasRepository: jest.fn(),
    }));

    // Env
    jest.mock("../env", () => ({ envVars: env }));
  });

  test("constructs deps and wires repository config correctly", async () => {
    // get current mock instances
    const { createLogger } = jest.requireMock("@internal/helpers");
    const { SupplierConfigRepository } = jest.requireMock(
      "@internal/datastore",
    );
    const { SupplierQuotasRepository } = jest.requireMock(
      "@internal/datastore",
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDependenciesContainer } = require("../deps");
    const deps: Deps = createDependenciesContainer();
    expect(createLogger).toHaveBeenCalledTimes(1);
    expect(SupplierConfigRepository).toHaveBeenCalledTimes(1);
    const supplierConfigRepoCtorArgs = SupplierConfigRepository.mock.calls[0];
    expect(supplierConfigRepoCtorArgs[1]).toEqual({
      supplierConfigTableName: "SupplierConfigTable",
    });
    expect(SupplierQuotasRepository).toHaveBeenCalledTimes(1);
    const supplierQuotasRepoCtorArgs = SupplierQuotasRepository.mock.calls[0];
    expect(supplierQuotasRepoCtorArgs[1]).toEqual({
      supplierQuotasTableName: "SupplierQuotasTable",
    });
    expect(deps.env).toEqual(env);
  });
});

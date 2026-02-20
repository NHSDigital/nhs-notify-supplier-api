import type { Deps } from "lambdas/supplier-allocator/src/config/deps";

describe("createDependenciesContainer", () => {
  const env = {
    SUPPLIER_CONFIG_TABLE_NAME: "SupplierConfigTable",
    VARIANT_MAP: {
      lv1: {
        supplierId: "supplier1",
        specId: "spec1",
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDependenciesContainer } = require("../deps");
    const deps: Deps = createDependenciesContainer();
    expect(createLogger).toHaveBeenCalledTimes(1);
    expect(SupplierConfigRepository).toHaveBeenCalledTimes(1);
    const supplierConfigRepoCtorArgs = SupplierConfigRepository.mock.calls[0];
    expect(supplierConfigRepoCtorArgs[2]).toEqual({
      supplierConfigTableName: "SupplierConfigTable",
    });
    expect(deps.env).toEqual(env);
  });
});

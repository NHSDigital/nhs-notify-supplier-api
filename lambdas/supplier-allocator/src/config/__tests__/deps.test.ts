import type { Deps } from "lambdas/supplier-allocator/src/config/deps";

describe("createDependenciesContainer", () => {
  const env = {
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

    // Env
    jest.mock("../env", () => ({ envVars: env }));
  });

  test("constructs deps and wires repository config correctly", async () => {
    // get current mock instances
    const { createLogger } = jest.requireMock("@internal/helpers");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDependenciesContainer } = require("../deps");
    const deps: Deps = createDependenciesContainer();
    expect(createLogger).toHaveBeenCalledTimes(1);

    expect(deps.env).toEqual(env);
  });
});

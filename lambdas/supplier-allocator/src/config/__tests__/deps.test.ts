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

    // pino
    jest.mock("pino", () => ({
      __esModule: true,
      default: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      })),
    }));

    // Repo client
    jest.mock("@internal/datastore", () => ({
      LetterRepository: jest.fn(),
    }));

    // Env
    jest.mock("../env", () => ({ envVars: env }));
  });

  test("constructs deps and wires repository config correctly", async () => {
    // get current mock instances
    const pinoMock = jest.requireMock("pino");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDependenciesContainer } = require("../deps");
    const deps: Deps = createDependenciesContainer();

    expect(pinoMock.default).toHaveBeenCalledTimes(1);
    expect(deps.env).toEqual(env);
  });
});

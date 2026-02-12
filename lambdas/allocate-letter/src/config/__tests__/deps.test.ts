import type { Deps } from "lambdas/allocate-letter/src/config/deps";

describe("createDependenciesContainer", () => {
  const env = {
    LETTERS_TABLE_NAME: "LettersTable",
    LETTER_TTL_HOURS: 12_960,
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

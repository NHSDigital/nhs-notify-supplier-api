import type { Deps } from "lambdas/upsert-letter/src/config/deps";

describe("createDependenciesContainer", () => {
  const env = {
    LETTERS_TABLE_NAME: "LettersTable",
    LETTER_TTL_HOURS: 12_960,
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
      LetterRepository: jest.fn(),
    }));

    // Env
    jest.mock("../env", () => ({ envVars: env }));
  });

  test("constructs deps and wires repository config correctly", async () => {
    // get current mock instances
    const { createLogger } = jest.requireMock("@internal/helpers");
    const { LetterRepository } = jest.requireMock("@internal/datastore");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDependenciesContainer } = require("../deps");
    const deps: Deps = createDependenciesContainer();

    expect(createLogger).toHaveBeenCalledTimes(1);

    expect(LetterRepository).toHaveBeenCalledTimes(1);
    const letterRepoCtorArgs = LetterRepository.mock.calls[0];
    expect(letterRepoCtorArgs[2]).toEqual({
      lettersTableName: "LettersTable",
      lettersTtlHours: 12_960,
    });

    expect(deps.env).toEqual(env);
  });
});

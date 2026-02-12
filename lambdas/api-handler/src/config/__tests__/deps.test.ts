import type { Deps } from "../deps";

describe("createDependenciesContainer", () => {
  const env = {
    LETTERS_TABLE_NAME: "LettersTable",
    LETTER_TTL_HOURS: 12_960,
    MI_TABLE_NAME: "MITable",
    MI_TTL_HOURS: 2160,
    SUPPLIER_ID_HEADER: "nhsd-supplier-id",
    APIM_CORRELATION_HEADER: "nhsd-correlation-id",
    DOWNLOAD_URL_TTL_SECONDS: 60,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    jest.mock("@internal/helpers", () => ({
      createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        level: "info",
      })),
    }));

    jest.mock("@aws-sdk/client-s3", () => ({
      S3Client: jest.fn(),
    }));

    jest.mock("@aws-sdk/client-sqs", () => ({
      SQSClient: jest.fn(),
    }));

    // Repo client
    jest.mock("@internal/datastore", () => ({
      LetterRepository: jest.fn(),
      MIRepository: jest.fn(),
      DBHealthcheck: jest.fn(),
    }));

    // Env
    jest.mock("../env", () => ({ envVars: env }));
  });

  test("constructs deps and wires repository config correctly", async () => {
    // get current mock instances
    const { S3Client } = jest.requireMock("@aws-sdk/client-s3");
    const { SQSClient } = jest.requireMock("@aws-sdk/client-sqs");
    const { createLogger } = jest.requireMock("@internal/helpers");
    const { LetterRepository, MIRepository } = jest.requireMock(
      "@internal/datastore",
    );

    // allow re-import of deps to leverage mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDependenciesContainer } = require("../deps");
    const deps: Deps = createDependenciesContainer();

    expect(S3Client).toHaveBeenCalledTimes(1);

    expect(SQSClient).toHaveBeenCalledTimes(1);

    expect(createLogger).toHaveBeenCalledTimes(1);

    expect(LetterRepository).toHaveBeenCalledTimes(1);
    const letterRepoCtorArgs = LetterRepository.mock.calls[0];
    expect(letterRepoCtorArgs[2]).toEqual({
      lettersTableName: "LettersTable",
      lettersTtlHours: 12_960,
    });

    expect(MIRepository).toHaveBeenCalledTimes(1);
    const miRepoCtorArgs = MIRepository.mock.calls[0];
    expect(miRepoCtorArgs[2]).toEqual({
      miTableName: "MITable",
      miTtlHours: 2160,
    });

    expect(deps.env).toEqual(env);
  });
});

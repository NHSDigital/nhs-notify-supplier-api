
import type { Deps } from '../deps';

describe('createDependenciesContainer', () => {

  const env = {
    LETTERS_TABLE_NAME: 'LettersTable',
    LETTER_TTL_HOURS: 12960,
    MI_TABLE_NAME: 'MITable',
    MI_TTL_HOURS: 2160,
    SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
    APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
    DOWNLOAD_URL_TTL_SECONDS: 60
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // pino
    jest.mock('pino', () => ({
      __esModule: true,
      default: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      })),
    }));

    jest.mock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn(),
    }));

    // Repo client
    jest.mock('../../../../../internal/datastore', () => ({
      LetterRepository: jest.fn(),
      MIRepository: jest.fn(),
    }));

    // Env
    jest.mock('../env', () => ({envVars: env}));
  });

  test('constructs deps and wires repository config correctly', async () => {
    // get current mock instances
    const { S3Client } = jest.requireMock('@aws-sdk/client-s3') as { S3Client: jest.Mock };
    const pinoMock = jest.requireMock('pino') as { default: jest.Mock };
    const { LetterRepository, MIRepository } = jest.requireMock('../../../../../internal/datastore') as {
      LetterRepository: jest.Mock,
      MIRepository: jest.Mock
    };

    const { createDependenciesContainer } = require('../deps');
    const deps: Deps = createDependenciesContainer();

    expect(S3Client).toHaveBeenCalledTimes(1);
    expect(pinoMock.default).toHaveBeenCalledTimes(1);

    expect(LetterRepository).toHaveBeenCalledTimes(1);
    const letterRepoCtorArgs = (LetterRepository as jest.Mock).mock.calls[0];
    expect(letterRepoCtorArgs[2]).toEqual({
      lettersTableName: 'LettersTable',
      lettersTtlHours: 12960
    });

    expect(MIRepository).toHaveBeenCalledTimes(1);
    const miRepoCtorArgs = (MIRepository as jest.Mock).mock.calls[0];
    expect(miRepoCtorArgs[2]).toEqual({
      miTableName: 'MITable',
      miTtlHours: 2160
    });

    expect(deps.env).toEqual(env);
  });
});

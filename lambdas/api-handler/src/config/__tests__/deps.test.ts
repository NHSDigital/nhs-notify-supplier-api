
import type { Deps } from '../deps';

describe('getDeps()', () => {
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
    }));

    // Env
    jest.mock('../env', () => ({
      lambdaEnv: {
        LETTERS_TABLE_NAME: 'LettersTable',
        LETTER_TTL_HOURS: '24',
        SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
        APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
        DOWNLOAD_URL_TTL_SECONDS: '3600'
      },
    }));
  });

  test('constructs deps and wires repository config correctly', async () => {
    // get current mock instances
    const { S3Client } = jest.requireMock('@aws-sdk/client-s3') as { S3Client: jest.Mock };
    const pinoMock = jest.requireMock('pino') as { default: jest.Mock };
    const { LetterRepository } = jest.requireMock('../../../../../internal/datastore') as { LetterRepository: jest.Mock };

    const { getDeps } = require('../deps');
    const deps: Deps = getDeps();

    expect(S3Client).toHaveBeenCalledTimes(1);
    expect(pinoMock.default).toHaveBeenCalledTimes(1);

    expect(LetterRepository).toHaveBeenCalledTimes(1);
    const repoCtorArgs = (LetterRepository as jest.Mock).mock.calls[0];
    expect(repoCtorArgs[2]).toEqual({
      lettersTableName: 'LettersTable',
      ttlHours: 24
    });

    expect(deps.env).toEqual({
      LETTERS_TABLE_NAME: 'LettersTable',
      LETTER_TTL_HOURS: '24',
      SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
      APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
      DOWNLOAD_URL_TTL_SECONDS: '3600'
    });
  });

  test('is a singleton (second call returns the same object; constructors not re-run)', async () => {
    // get current mock instances
    const { S3Client } = jest.requireMock('@aws-sdk/client-s3') as { S3Client: jest.Mock };
    const pinoMock = jest.requireMock('pino') as { default: jest.Mock };
    const { LetterRepository } = jest.requireMock('../../../../../internal/datastore') as { LetterRepository: jest.Mock };

    const { getDeps } = require('../deps');

    const first = getDeps();
    const second = getDeps();

    expect(first).toBe(second);
    expect(S3Client).toHaveBeenCalledTimes(1);
    expect(LetterRepository).toHaveBeenCalledTimes(1);
    expect(pinoMock.default).toHaveBeenCalledTimes(1);
  });
});

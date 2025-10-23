import { ZodError } from 'zod';

describe('lambdaEnv', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears cached modules
    process.env = { ...OLD_ENV }; // Clone original env
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore
  });

  it('should load all environment variables successfully', () => {
    process.env.SUPPLIER_ID_HEADER = 'nhsd-supplier-id';
    process.env.APIM_CORRELATION_HEADER = 'nhsd-correlation-id';
    process.env.LETTERS_TABLE_NAME = 'letters-table';
    process.env.MI_TABLE_NAME = 'mi-table';
    process.env.LETTER_TTL_HOURS = '12960';
    process.env.DOWNLOAD_URL_TTL_SECONDS = '60';
    process.env.MAX_LIMIT = '2500';

    const { envVars } = require('../env');

    expect(envVars).toEqual({
      SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
      APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
      LETTERS_TABLE_NAME: 'letters-table',
      MI_TABLE_NAME: 'mi-table',
      LETTER_TTL_HOURS: 12960,
      DOWNLOAD_URL_TTL_SECONDS: 60,
      MAX_LIMIT: 2500,
    });
  });

  it('should throw if a required env var is missing', () => {
    process.env.SUPPLIER_ID_HEADER = 'nhsd-supplier-id';
    process.env.APIM_CORRELATION_HEADER = 'nhsd-correlation-id';
    process.env.LETTERS_TABLE_NAME = undefined; // simulate missing var
    process.env.MI_TABLE_NAME = 'mi-table';
    process.env.LETTER_TTL_HOURS = '12960';
    process.env.DOWNLOAD_URL_TTL_SECONDS = '60';

    expect(() => require('../env')).toThrow(ZodError);
  });

  it('should not throw if optional are not set', () => {
    process.env.SUPPLIER_ID_HEADER = 'nhsd-supplier-id';
    process.env.APIM_CORRELATION_HEADER = 'nhsd-correlation-id';
    process.env.LETTERS_TABLE_NAME = 'letters-table';
    process.env.MI_TABLE_NAME = 'mi-table';
    process.env.LETTER_TTL_HOURS = '12960';
    process.env.DOWNLOAD_URL_TTL_SECONDS = '60';

    const { envVars } = require('../env');

    expect(envVars).toEqual({
      SUPPLIER_ID_HEADER: 'nhsd-supplier-id',
      APIM_CORRELATION_HEADER: 'nhsd-correlation-id',
      LETTERS_TABLE_NAME: 'letters-table',
      MI_TABLE_NAME: 'mi-table',
      LETTER_TTL_HOURS: 12960,
      DOWNLOAD_URL_TTL_SECONDS: 60,
      MAX_LIMIT: undefined
    });
  });
});

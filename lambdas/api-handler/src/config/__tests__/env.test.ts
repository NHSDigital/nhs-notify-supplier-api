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
    process.env.SUPPLIER_ID_HEADER = 'x-supplier-id';
    process.env.APIM_CORRELATION_HEADER = 'x-correlation-id';
    process.env.LETTERS_TABLE_NAME = 'letters-table';
    process.env.LETTER_TTL_HOURS = '24';

    const { lambdaEnv } = require('../env');

    expect(lambdaEnv).toEqual({
      SUPPLIER_ID_HEADER: 'x-supplier-id',
      APIM_CORRELATION_HEADER: 'x-correlation-id',
      LETTERS_TABLE_NAME: 'letters-table',
      LETTER_TTL_HOURS: '24'
    });
  });

  it('should throw if a required env var is missing', () => {
    process.env.SUPPLIER_ID_HEADER = 'x-supplier-id';
    process.env.APIM_CORRELATION_HEADER = 'x-correlation-id';
    process.env.LETTERS_TABLE_NAME = undefined; // simulate missing var
    process.env.LETTER_TTL_HOURS = '24';

    expect(() => require('../env')).toThrow(
      'Missing required env var: LETTERS_TABLE_NAME'
    );
  });
});

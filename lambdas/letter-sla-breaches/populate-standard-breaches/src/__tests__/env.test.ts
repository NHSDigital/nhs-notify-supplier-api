import createDependenciesContainer from "../handler/deps";

describe("createDependenciesContainer", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...oldEnv,
      ATHENA_WORKGROUP: "workgroup",
      ATHENA_DATABASE: "database",
      EVENT_CACHE_TABLE_NAME: "event_cache",
      PACK_SPECIFICATION_TABLE_NAME: "pack_specification",
      DAYS_TO_LOOK_BACK: "14",
      STANDARD_SLA_WORKING_DAYS: "2",
      BANK_HOLIDAY_JSON_URL: "https://www.gov.uk/bank-holidays.json",
    };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it("parses numeric configuration from the environment", () => {
    const { env } = createDependenciesContainer();

    expect(env.DAYS_TO_LOOK_BACK).toBe(14);
    expect(env.STANDARD_SLA_WORKING_DAYS).toBe(2);
  });

  it("passes the optional log level through", () => {
    process.env.PINO_LOG_LEVEL = "debug";

    expect(createDependenciesContainer().env.PINO_LOG_LEVEL).toBe("debug");
  });

  it("throws when a required string variable is missing", () => {
    delete process.env.ATHENA_WORKGROUP;

    expect(() => createDependenciesContainer()).toThrow();
  });

  it.each(["abc", "0", "1.5", ""])(
    "rejects invalid STANDARD_SLA_WORKING_DAYS %p",
    (value) => {
      process.env.STANDARD_SLA_WORKING_DAYS = value;

      expect(() => createDependenciesContainer()).toThrow();
    },
  );

  it("rejects a missing DAYS_TO_LOOK_BACK", () => {
    delete process.env.DAYS_TO_LOOK_BACK;

    expect(() => createDependenciesContainer()).toThrow();
  });
});

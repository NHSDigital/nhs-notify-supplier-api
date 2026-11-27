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
    };
    delete process.env.DAYS_TO_LOOK_BACK;
    delete process.env.STANDARD_SLA_WORKING_DAYS;
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it("does not require the standard breaches variables", () => {
    expect(createDependenciesContainer().env).toEqual({
      ATHENA_WORKGROUP: "workgroup",
      ATHENA_DATABASE: "database",
      EVENT_CACHE_TABLE_NAME: "event_cache",
      PACK_SPECIFICATION_TABLE_NAME: "pack_specification",
    });
  });

  it("throws when a required variable is missing", () => {
    delete process.env.ATHENA_DATABASE;

    expect(() => createDependenciesContainer()).toThrow();
  });
});

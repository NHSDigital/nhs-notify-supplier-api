import { createLogger } from "../logger";

describe("createLogger", () => {
  it("should create a logger with default log level", () => {
    const logger = createLogger();

    expect(logger.level).toBe("info");
  });

  it("should create a logger with custom log level", () => {
    const logger = createLogger({ logLevel: "debug" });

    expect(logger.level).toBe("debug");
  });
});

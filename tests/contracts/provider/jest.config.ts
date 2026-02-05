import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "@nhsdigital/nhs-notify-event-schemas-supplier-api$":
      "<rootDir>/../../../internal/events/src",
  },
};

export default config;

export default {
  preset: "ts-jest",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "./.reports/unit/coverage",
  coverageProvider: "babel",
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: -10,
    },
  },
  coveragePathIgnorePatterns: ["/__tests__/"],
  testPathIgnorePatterns: [".build"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  testEnvironment: "node",
};

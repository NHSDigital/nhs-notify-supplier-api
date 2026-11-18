export const baseJestConfig = {
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

  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Test Report",
        outputPath: "./.reports/unit/test-report.html",
        includeFailureMsg: true,
      },
    ],
  ],

  testEnvironment: "node",
};

export default baseJestConfig;

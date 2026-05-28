export default {
  preset: "ts-jest",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  coveragePathIgnorePatterns: ["/node_modules/", "__tests__"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          allowJs: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(https-proxy-agent|agent-base|@pact-foundation/pact|@pact-foundation/pact-core|@pact-foundation/src)/)",
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

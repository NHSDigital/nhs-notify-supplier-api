export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  coveragePathIgnorePatterns: ["/node_modules/", "__tests__"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transform: {
    "^.+\\.ts$": ["ts-jest"],
    "^.+\\.(js|mjs)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(?:@pact-foundation|https-proxy-agent|agent-base|proxy-agent-negotiate|proxy-from-env)/)",
  ],
};

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  testTimeout: 30000,
  verbose: true,
  setupFiles: ["./src/tests/setup.ts"],
};

export default config;

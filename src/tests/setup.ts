import "dotenv/config";

process.env.NODE_ENV = "test";
// Suppress console.error during tests to keep output clean
jest.spyOn(console, "error").mockImplementation(() => {});

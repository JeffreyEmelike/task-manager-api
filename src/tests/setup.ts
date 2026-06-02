import "dotenv/config";

// Suppress console.error during tests to keep output clean
jest.spyOn(console, "error").mockImplementation(() => {});

import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { loginAs, createTestWorkspace, createTestProject, createTestTask, bearer } from "./helpers";

let token: string;
let workspaceId: string;
let projectId: string;
let taskId: string;

// Mock ALL external AI/embedding calls so tests run without real API keys
jest.mock("../services/embeddingService", () => ({
  generateEmbedding: jest.fn().mockResolvedValue(Array(1536).fill(0.01)),
}));

jest.mock("../services/searchService", () => ({
  semanticSearch: jest.fn().mockResolvedValue([
    { _id: "mock-id-1", title: "Fix login bug", status: "todo", priority: "high", score: 0.95 },
    { _id: "mock-id-2", title: "Auth token issue", status: "in-progress", priority: "medium", score: 0.88 },
  ]),
}));

jest.mock("../services/autoTagService", () => ({
  generateTags: jest.fn().mockResolvedValue(["bug", "backend", "auth"]),
}));

jest.mock("../services/aiRecommendationService", () => ({
  recommendForTask: jest.fn().mockResolvedValue({
    suggestedPriority: "high",
    reasoning: "Task has a close due date and blocks authentication for all users.",
  }),
}));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST!);
  token = await loginAs("AI Tester", "ai@test.com", "password123");
  workspaceId = await createTestWorkspace(token, "AI Workspace");
  projectId = await createTestProject(token, workspaceId, "AI Project");
  taskId = await createTestTask(token, projectId, workspaceId, "Fix authentication");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── GET /api/search ───────────────────────────────────────────────────────────
describe("GET /api/search", () => {
  it("returns search results for a valid query", async () => {
    const res = await request(app)
      .get("/api/search?q=fix+login+bug")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("query");
    expect(res.body).toHaveProperty("count");
    expect(res.body).toHaveProperty("results");
    expect(res.body.query).toBe("fix login bug");
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("returns 400 when query param is missing", async () => {
    const res = await request(app)
      .get("/api/search")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Search query is required");
  });

  it("returns 400 when query is only whitespace", async () => {
    const res = await request(app)
      .get("/api/search?q=   ")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/search?q=login");
    expect(res.status).toBe(401);
  });

  it("respects the limit query param", async () => {
    const res = await request(app)
      .get("/api/search?q=bug&limit=1")
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
  });
});

// ── POST /api/tasks/:id/autotag ───────────────────────────────────────────────
describe("POST /api/tasks/:id/autotag", () => {
  it("generates and saves tags to the task", async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/autotag`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tags");
    expect(res.body).toHaveProperty("task");
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags).toEqual(["bug", "backend", "auth"]);
    expect(res.body.task.aiTags).toEqual(["bug", "backend", "auth"]);
  });

  it("returns 404 for a non-existent task ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/tasks/${fakeId}/autotag`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).post(`/api/tasks/${taskId}/autotag`);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/tasks/:id/recommend ──────────────────────────────────────────────
describe("GET /api/tasks/:id/recommend", () => {
  it("returns a priority recommendation with reasoning", async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}/recommend`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("suggestedPriority");
    expect(res.body).toHaveProperty("reasoning");
    expect(["low", "medium", "high", "critical"]).toContain(res.body.suggestedPriority);
    expect(typeof res.body.reasoning).toBe("string");
  });

  it("returns 404 for a non-existent task ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/tasks/${fakeId}/recommend`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/tasks/${taskId}/recommend`);
    expect(res.status).toBe(401);
  });
});

import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { loginAs, createTestWorkspace, createTestProject, bearer } from "./helpers";

let token: string;
let workspaceId: string;
let projectId: string;
let taskId: string;

// Mock generateEmbedding so tests don't need a real OpenAI key
jest.mock("../services/embeddingService", () => ({
  generateEmbedding: jest.fn().mockResolvedValue(Array(1536).fill(0.01)),
}));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST!);
  token = await loginAs("Task Tester", "tasks@test.com", "password123");
  workspaceId = await createTestWorkspace(token, "Task Workspace");
  projectId = await createTestProject(token, workspaceId, "Task Project");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── POST /api/projects/:pid/tasks ─────────────────────────────────────────────
describe("POST /api/projects/:pid/tasks", () => {
  it("creates a task and returns 201", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", bearer(token))
      .send({
        title: "Fix login bug",
        description: "Users cannot log in after password reset",
        priority: "high",
        status: "todo",
        workspace: workspaceId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.title).toBe("Fix login bug");
    expect(res.body.priority).toBe("high");
    expect(res.body.status).toBe("todo");
    expect(res.body.project).toBe(projectId);
    expect(Array.isArray(res.body.embedding)).toBe(true);

    taskId = res.body._id as string;
  });

  it("returns 500 when title is missing", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", bearer(token))
      .send({ priority: "low", workspace: workspaceId });

    expect(res.status).toBe(500);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: "No Auth" });

    expect(res.status).toBe(401);
  });

  it("defaults status to todo and priority to medium", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", bearer(token))
      .send({ title: "Defaults test", workspace: workspaceId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("todo");
    expect(res.body.priority).toBe("medium");
  });
});

// ── GET /api/projects/:pid/tasks ──────────────────────────────────────────────
describe("GET /api/projects/:pid/tasks", () => {
  it("returns all tasks in the project", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("filters tasks by status", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=todo`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    res.body.forEach((t: { status: string }) => {
      expect(t.status).toBe("todo");
    });
  });

  it("filters tasks by priority", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?priority=high`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    res.body.forEach((t: { priority: string }) => {
      expect(t.priority).toBe("high");
    });
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/projects/${projectId}/tasks`);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────
describe("GET /api/tasks/:id", () => {
  it("returns a single task by ID", async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(taskId);
    expect(res.body.title).toBe("Fix login bug");
  });

  it("returns 404 for a non-existent task", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────
describe("PATCH /api/tasks/:id", () => {
  it("updates the task status", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token))
      .send({ status: "in-progress", workspace: workspaceId });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("in-progress");
  });

  it("updates the task priority", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token))
      .send({ priority: "critical", workspace: workspaceId });

    expect(res.status).toBe(200);
    expect(res.body.priority).toBe("critical");
  });

  it("updates the task title", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token))
      .send({ title: "Fix login bug — updated", workspace: workspaceId });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Fix login bug — updated");
  });

  it("returns 404 for a non-existent task", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/tasks/${fakeId}`)
      .set("Authorization", bearer(token))
      .send({ status: "done", workspace: workspaceId });

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ status: "done" });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/tasks/:id/comments ──────────────────────────────────────────────
describe("POST /api/tasks/:id/comments", () => {
  it("adds a comment to a task and returns 201", async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set("Authorization", bearer(token))
      .send({ body: "Looking into this now." });

    expect(res.status).toBe(201);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].body).toBe("Looking into this now.");
    expect(res.body.comments[0]).toHaveProperty("author");
    expect(res.body.comments[0]).toHaveProperty("_id");
  });

  it("adds a second comment — both are present", async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set("Authorization", bearer(token))
      .send({ body: "Still working on it." });

    expect(res.status).toBe(201);
    expect(res.body.comments).toHaveLength(2);
  });

  it("returns 400 when comment body is empty", async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set("Authorization", bearer(token))
      .send({ body: "   " });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Comment body is required");
  });

  it("returns 400 when body field is missing", async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set("Authorization", bearer(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .send({ body: "No auth" });

    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
describe("DELETE /api/tasks/:id", () => {
  it("deletes the task and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token))
      .send({ workspace: workspaceId });

    expect(res.status).toBe(204);
  });

  it("returns 404 when getting the deleted task", async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting an already-deleted task", async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", bearer(token))
      .send({ workspace: workspaceId });

    expect(res.status).toBe(404);
  });
});

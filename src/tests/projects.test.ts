import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { loginAs, createTestWorkspace, bearer } from "./helpers";

let token: string;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST!);
  token = await loginAs("Project Tester", "project@test.com", "password123");
  workspaceId = await createTestWorkspace(token, "Project Workspace");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── POST /api/workspaces/:wid/projects ────────────────────────────────────────
describe("POST /api/workspaces/:wid/projects", () => {
  it("creates a project and returns 201", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", bearer(token))
      .send({ title: "Alpha", description: "First project", status: "active" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.title).toBe("Alpha");
    expect(res.body.workspace).toBe(workspaceId);

    projectId = res.body._id as string;
  });

  it("returns 500 when title is missing", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", bearer(token))
      .send({ description: "No title" });

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .send({ title: "No Auth" });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/workspaces/:wid/projects ─────────────────────────────────────────
describe("GET /api/workspaces/:wid/projects", () => {
  it("returns all projects in the workspace", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].workspace).toBe(workspaceId);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`);

    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/projects/:id ───────────────────────────────────────────────────
describe("PATCH /api/projects/:id", () => {
  it("updates the project title and returns 200", async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set("Authorization", bearer(token))
      .send({ title: "Alpha Updated" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Alpha Updated");
  });

  it("updates the project status", async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set("Authorization", bearer(token))
      .send({ status: "archived" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("archived");
  });

  it("returns 404 for a non-existent project ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/projects/${fakeId}`)
      .set("Authorization", bearer(token))
      .send({ title: "Ghost" });

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .send({ title: "No Auth" });

    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/projects/:id ──────────────────────────────────────────────────
describe("DELETE /api/projects/:id", () => {
  it("deletes the project and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", bearer(token));

    expect(res.status).toBe(204);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`);

    expect(res.status).toBe(401);
  });
});

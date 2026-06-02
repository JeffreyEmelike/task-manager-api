import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { loginAs, loginWithTokens, bearer } from "./helpers";

let adminToken: string;
let memberToken: string;
let workspaceId: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST!);

  // Admin user — will create the workspace
  adminToken = await loginAs("Admin User", "admin.ws@test.com", "password123");

  // Member user — will be invited
  memberToken = await loginAs("Member User", "member.ws@test.com", "password123");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── POST /api/workspaces ──────────────────────────────────────────────────────
describe("POST /api/workspaces", () => {
  it("creates a workspace and returns 201", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .set("Authorization", bearer(adminToken))
      .send({ name: "Engineering" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("Engineering");
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].role).toBe("admin");

    workspaceId = res.body._id as string; // save for subsequent tests
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .send({ name: "No Auth" });

    expect(res.status).toBe(401);
  });

  it("returns 500 when name is missing", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .set("Authorization", bearer(adminToken))
      .send({});

    expect(res.status).toBe(500);
  });
});

// ── GET /api/workspaces ───────────────────────────────────────────────────────
describe("GET /api/workspaces", () => {
  it("returns the list of workspaces for the authenticated user", async () => {
    const res = await request(app)
      .get("/api/workspaces")
      .set("Authorization", bearer(adminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/workspaces");
    expect(res.status).toBe(401);
  });
});

// ── GET /api/workspaces/:id ───────────────────────────────────────────────────
describe("GET /api/workspaces/:id", () => {
  it("returns the workspace by ID", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(workspaceId);
    expect(res.body.name).toBe("Engineering");
  });

  it("returns 404 for a non-existent workspace ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/workspaces/${fakeId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.status).toBe(404);
  });
});

// ── POST /api/workspaces/:id/invite ──────────────────────────────────────────
describe("POST /api/workspaces/:id/invite", () => {
  it("admin can invite a user by email", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set("Authorization", bearer(adminToken))
      .send({ email: "member.ws@test.com", role: "member" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("added to workspace");
  });

  it("returns 409 when user is already a member", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set("Authorization", bearer(adminToken))
      .send({ email: "member.ws@test.com" });

    expect(res.status).toBe(409);
  });

  it("returns 404 when inviting a non-existent email", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set("Authorization", bearer(adminToken))
      .send({ email: "ghost@nowhere.com" });

    expect(res.status).toBe(404);
  });

  it("returns 403 when a member tries to invite", async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/invite`)
      .set("Authorization", bearer(memberToken))
      .send({ email: "anyone@test.com" });

    expect(res.status).toBe(403);
  });
});

// ── PATCH /api/workspaces/:id ─────────────────────────────────────────────────
describe("PATCH /api/workspaces/:id", () => {
  it("admin can update the workspace name", async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}`)
      .set("Authorization", bearer(adminToken))
      .send({ name: "Engineering Team" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Engineering Team");
  });

  it("returns 403 when a member tries to update", async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}`)
      .set("Authorization", bearer(memberToken))
      .send({ name: "Hacked Name" });

    expect(res.status).toBe(403);
  });
});

// ── GET /api/workspaces/:id/analytics ────────────────────────────────────────
describe("GET /api/workspaces/:id/analytics", () => {
  it("returns analytics object with byStatus, overdue and byAssignee", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/analytics`)
      .set("Authorization", bearer(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("byStatus");
    expect(res.body).toHaveProperty("overdue");
    expect(res.body).toHaveProperty("byAssignee");
    expect(Array.isArray(res.body.byStatus)).toBe(true);
    expect(Array.isArray(res.body.byAssignee)).toBe(true);
  });
});

// ── DELETE /api/workspaces/:id ────────────────────────────────────────────────
describe("DELETE /api/workspaces/:id", () => {
  it("returns 403 when a member tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}`)
      .set("Authorization", bearer(memberToken));

    expect(res.status).toBe(403);
  });

  it("admin can delete the workspace and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/workspaces/${workspaceId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.status).toBe(204);
  });

  it("returns 404 after deleting a workspace", async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set("Authorization", bearer(adminToken));

    expect(res.status).toBe(404);
  });
});

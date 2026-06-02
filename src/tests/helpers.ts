import request from "supertest";
import app from "../app";

// ── Register + login a user, return their access token ────────────────────────
export const loginAs = async (
  name = "Test User",
  email = "test@example.com",
  password = "password123",
): Promise<string> => {
  // Try register — ignore 409 if already exists
  await request(app).post("/api/auth/register").send({ name, email, password });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return res.body.accessToken as string;
};

// ── Register + login, return both tokens ──────────────────────────────────────
export const loginWithTokens = async (
  name = "Test User",
  email = "test@example.com",
  password = "password123",
): Promise<{ accessToken: string; refreshToken: string }> => {
  await request(app).post("/api/auth/register").send({ name, email, password });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return {
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
  };
};

// ── Create a workspace, return its ID ─────────────────────────────────────────
export const createTestWorkspace = async (
  token: string,
  name = "Test Workspace",
): Promise<string> => {
  const res = await request(app)
    .post("/api/workspaces")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });

  return res.body._id as string;
};

// ── Create a project inside a workspace, return its ID ───────────────────────
export const createTestProject = async (
  token: string,
  workspaceId: string,
  title = "Test Project",
): Promise<string> => {
  const res = await request(app)
    .post(`/api/workspaces/${workspaceId}/projects`)
    .set("Authorization", `Bearer ${token}`)
    .send({ title });

  return res.body._id as string;
};

// ── Create a task inside a project, return its ID ────────────────────────────
export const createTestTask = async (
  token: string,
  projectId: string,
  workspaceId: string,
  title = "Test Task",
): Promise<string> => {
  const res = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set("Authorization", `Bearer ${token}`)
    .send({ title, priority: "medium", status: "todo", workspace: workspaceId });

  return res.body._id as string;
};

// ── Auth header helper ────────────────────────────────────────────────────────
export const bearer = (token: string) => `Bearer ${token}`;

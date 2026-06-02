import request from "supertest";
import mongoose from "mongoose";
import app from "../app";

// ── Connect / disconnect ──────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST!);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("creates a user and returns 201 with both tokens", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@test.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
  });

  it("returns 409 when email is already registered", async () => {
    const user = { name: "Bob", email: "bob@test.com", password: "password123" };
    await request(app).post("/api/auth/register").send(user);
    const res = await request(app).post("/api/auth/register").send(user);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already in use");
  });

  it("returns 500 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "missing@test.com" }); // no name or password

    expect(res.status).toBe(500);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login User",
      email: "login@test.com",
      password: "password123",
    });
  });

  it("logs in with correct credentials and returns 200 with tokens", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("returns 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
describe("POST /api/auth/refresh", () => {
  let refreshToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Refresh User",
      email: "refresh@test.com",
      password: "password123",
    });
    refreshToken = res.body.refreshToken as string;
  });

  it("returns a new token pair with a valid refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    // New refresh token must be different — rotation is working
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it("returns 401 when no refresh token is provided", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(401);
  });

  it("returns 401 when refresh token is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "completely.invalid.token" });
    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
describe("POST /api/auth/logout", () => {
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Logout User",
      email: "logout@test.com",
      password: "password123",
    });
    accessToken  = res.body.accessToken as string;
    refreshToken = res.body.refreshToken as string;
  });

  it("logs out successfully and revokes the refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });

  it("cannot use the revoked refresh token after logout", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });

  it("returns 401 when called without an access token", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: "some-token" });

    expect(res.status).toBe(401);
  });

  it("returns 400 when no refresh token is provided in body", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

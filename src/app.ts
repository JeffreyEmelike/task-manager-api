import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth";
import WorkspaceRoutes from "./routes/workspaces";
import projectRoutes from "./routes/projects";

const app = express();

app.use(express.json()); // parse JSON request bodies

// Mount routes - all auth routes live under /api/auth
app.use("/api/auth", authRoutes);

// Global error handler - catches anything pass to next(error)
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || "Internal server error" });
  },
);

app.use("/api/workspaces", WorkspaceRoutes);
app.use("/api/workspaces/:wid/projects", projectRoutes);
app.use("/api/projects", projectRoutes);
export default app;

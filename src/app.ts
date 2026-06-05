import express from "express";
import "dotenv/config";
import helmet from "helmet"; // security headers
import rateLimit from "express-rate-limit"; // rate limiting
import { mongoSanitize } from "./middleware/sanitize";
import authRoutes from "./routes/auth";
import WorkspaceRoutes from "./routes/workspaces";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";
import searchRoutes from "./routes/search";

const app = express();

// Security middleware
app.use(helmet());

app.use(mongoSanitize);

// Body parsing
app.use(express.json()); // parse JSON request bodies

// Rate limmiting on auth routes - skip in test enviroment
if (process.env.NODE_ENV !== "test") {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
  });
  app.use("/api/auth", authLimiter);
}
// Mount routes - all auth routes live under /api/auth
app.use("/api/auth", authRoutes);

app.use("/api/workspaces", WorkspaceRoutes);
app.use("/api/workspaces/:wid/projects", projectRoutes);
app.use("/api/projects", projectRoutes);
// Nested — for creating and listing tasks under a project
app.use("/api/projects/:pid/tasks", taskRoutes);
// Direct — for getting, updating, deleting a single task by its own ID
app.use("/api/tasks", taskRoutes);
app.use("/api/search", searchRoutes);

// Global error handler - catches anything pass to next(error)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    const status = err.statusCode || err.status || 500;
    res
      .status(status)
      .json({ message: err.message || "Internal server error" });
  },
);
export default app;

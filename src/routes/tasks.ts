import { Router } from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
} from "../controllers/taskController";
import { authentication } from "../midleware/auth";

const router = Router({ mergeParams: true });

router.use(authentication);

// Task CRUD
router.get("/", getTasks); // GET    /api/projects/:pid/tasks
router.post("/", createTask); // POST   /api/projects/:pid/tasks
router.get("/:id", getTask); // GET    /api/tasks/:id
router.patch("/:id", updateTask); // PATCH  /api/tasks/:id
router.delete("/:id", deleteTask); // DELETE /api/tasks/:id

// Comments
router.post("/:id/comments", addComment);
// POST /api/tasks/:id/comments

export default router;

import { Router } from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { authentication } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(authentication);

router.get("/", getProjects);
router.post("/", createProject);
router.patch("/", updateProject);
router.delete("/", deleteProject);

export default router;

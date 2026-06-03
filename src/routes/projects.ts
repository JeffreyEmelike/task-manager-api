import { Router } from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { authentication } from "../middleware/auth";

import { validate } from "../middleware/validate";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projectSchemas";

const router = Router({ mergeParams: true });

router.use(authentication);

router.post("/", validate(createProjectSchema), createProject);
router.get("/", getProjects);
router.patch("/:id", validate(updateProjectSchema), updateProject);
router.delete("/:id", deleteProject);

export default router;

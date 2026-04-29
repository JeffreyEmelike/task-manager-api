import { Router } from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { authentication } from "@/midleware/auth";

const router = Router({ mergeParams: true });

router.use(authentication);

router.get("/", getProjects);
router.post("/", createProject);
router.patch("/", updateProject);
router.patch("/", deleteProject);

export default router;

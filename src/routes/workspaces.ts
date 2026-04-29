import { Router } from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
} from "../controllers/workspaceController";
import { authentication, authorize } from "../midleware/auth";

const router = Router();

// ALl workspace routes require a logged in user
router.use(authentication);

router.get("/", getWorkspaces);
router.post("/", createWorkspace);
router.get("/:id", getWorkspace);

// Update and delete require admin roles
router.patch("/:id", authorize("admin"), updateWorkspace);
router.delete("/:id", authorize("admin"), deleteWorkspace);

router.post("/:id/invite", authorize("admin"), inviteMember);

export default router;

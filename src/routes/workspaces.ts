import { Router } from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
} from "../controllers/workspaceController";
import { authentication, authorize } from "../middleware/auth";
import { getWorkspaceAnalytics } from "../controllers/analyticsController";
import { validate } from "../middleware/validate";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteSchema,
} from "../schemas/workspaceSchemas";

const router = Router();

// ALl workspace routes require a logged in user
router.use(authentication);

// Create workspace
router.post("/", validate(createWorkspaceSchema), createWorkspace);

// Get all workspaces
router.get("/", getWorkspaces);

// Get a single workspace
router.get("/:id", getWorkspace);

// update a workspace (admin only)
router.patch(
  "/:id",
  authorize("admin"),
  validate(updateWorkspaceSchema),
  updateWorkspace,
);

// delete requires admin roles
router.delete("/:id", authorize("admin"), deleteWorkspace);

// Invite member (admin only)
router.post(
  "/:id/invite",
  authorize("admin"),
  validate(inviteSchema),
  inviteMember,
);

router.get("/:id/analytics", getWorkspaceAnalytics);

export default router;

import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController";
import { authentication } from "../middleware/auth";

// validate middleware
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../schemas/authSchemas";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refreshToken);
router.post("/logout", authentication, validate(logoutSchema), logout);

export default router;

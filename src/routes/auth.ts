import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController";
import { authentication } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", authentication, logout);

export default router;

import { Router } from "express";
import { search } from "../controllers/searchController";
import { authentication } from "../middleware/auth";

const router = Router();
router.get("/", authentication, search);
export default router;

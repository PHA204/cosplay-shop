// Path: src/routes/adminAuthRoutes.js

import express from "express";
import { adminLogin, getCurrentAdmin, adminLogout } from "../controllers/adminAuthController.js";
import { authenticateAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", authenticateAdmin, getCurrentAdmin);
router.post("/logout", authenticateAdmin, adminLogout);

export default router;
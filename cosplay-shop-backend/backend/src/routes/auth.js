import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  changePassword
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(loginUser));
router.get("/me", authenticateToken, asyncHandler(getCurrentUser));
router.put("/profile", authenticateToken, asyncHandler(updateUserProfile));
router.put("/change-password", authenticateToken, asyncHandler(changePassword));
export default router;

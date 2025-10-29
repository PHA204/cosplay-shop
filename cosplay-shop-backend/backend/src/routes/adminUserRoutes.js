// Path: backend/src/routes/adminUserRoutes.js

import express from "express";
import { 
  authenticateAdmin, 
  requireRole, 
  logActivity 
} from "../middleware/isAdmin.js";
import {
  getAdminUsers,
  getUserDetail,
  updateUser,
  resetUserPassword,
  deleteUser,
  getUserStatistics,
  exportUsers,
} from "../controllers/adminUserController.js";

const router = express.Router();

// Tất cả routes đều cần admin authentication
router.use(authenticateAdmin);

// GET /api/admin/users - Lấy danh sách users
router.get("/", getAdminUsers);

// GET /api/admin/users/statistics - Thống kê users
router.get("/statistics", getUserStatistics);

// GET /api/admin/users/export - Export users ra CSV
router.get("/export", exportUsers);

// GET /api/admin/users/:id - Lấy chi tiết user
router.get("/:id", getUserDetail);

// PUT /api/admin/users/:id - Cập nhật user
router.put(
  "/:id",
  requireRole("admin", "super_admin"),
  logActivity("update_user"),
  updateUser
);

// POST /api/admin/users/:id/reset-password - Reset mật khẩu user
router.post(
  "/:id/reset-password",
  requireRole("admin", "super_admin"),
  logActivity("reset_user_password"),
  resetUserPassword
);

// DELETE /api/admin/users/:id - Xóa user
router.delete(
  "/:id",
  requireRole("super_admin"),
  logActivity("delete_user"),
  deleteUser
);

export default router;
// Path: src/routes/adminProductRoutes.js

import express from "express";
import { authenticateAdmin, requireRole, logActivity } from "../middleware/isAdmin.js";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  bulkUpdateProducts,
  exportProducts,
} from "../controllers/adminProductController.js";

const router = express.Router();

// Tất cả routes đều cần admin authentication
router.use(authenticateAdmin);

// GET /api/admin/products - Lấy danh sách sản phẩm
router.get("/", getAdminProducts);

// GET /api/admin/products/export - Export sản phẩm ra CSV
router.get("/export", exportProducts);

// GET /api/admin/products/:id/stats - Thống kê sản phẩm
router.get("/:id/stats", getProductStats);

// POST /api/admin/products - Tạo sản phẩm mới
router.post(
  "/",
  requireRole("admin", "super_admin"),
  logActivity("create_product"),
  createProduct
);

// PUT /api/admin/products/:id - Cập nhật sản phẩm
router.put(
  "/:id",
  requireRole("admin", "super_admin"),
  logActivity("update_product"),
  updateProduct
);

// DELETE /api/admin/products/:id - Xóa sản phẩm
router.delete(
  "/:id",
  requireRole("super_admin"),
  logActivity("delete_product"),
  deleteProduct
);

// POST /api/admin/products/bulk-update - Cập nhật hàng loạt
router.post(
  "/bulk-update",
  requireRole("admin", "super_admin"),
  logActivity("bulk_update_products"),
  bulkUpdateProducts
);

export default router;
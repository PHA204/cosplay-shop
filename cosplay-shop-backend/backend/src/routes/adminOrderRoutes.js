// Path: backend/routes/adminOrderRoutes.js
// Mô tả: Định nghĩa các route cho order management

import express from "express";
import { 
  authenticateAdmin, 
  requireRole, 
  logActivity 
} from "../middleware/isAdmin.js";
import {
  getAdminOrders,
  getOrderDetail,
  updateOrderStatus,
  processReturn,
  cancelOrder,
  updatePaymentStatus
} from "../controllers/adminOrderController.js";

const router = express.Router();

// Tất cả routes đều cần admin authentication
router.use(authenticateAdmin);

// GET /api/admin/orders - Lấy danh sách đơn hàng
router.get("/", getAdminOrders);

// GET /api/admin/orders/:id - Lấy chi tiết đơn hàng
router.get("/:id", getOrderDetail);

// PUT /api/admin/orders/:id/status - Cập nhật trạng thái
router.put(
  "/:id/status", 
  logActivity("update_order_status"), 
  updateOrderStatus
);

// POST /api/admin/orders/:id/return - Xử lý trả hàng
router.post(
  "/:id/return", 
  requireRole("admin", "super_admin"), 
  logActivity("process_return"), 
  processReturn
);

// POST /api/admin/orders/:id/cancel - Hủy đơn hàng
router.post(
  "/:id/cancel", 
  requireRole("admin", "super_admin"), 
  logActivity("cancel_order"), 
  cancelOrder
);
router.put(
  "/:id/payment", 
  logActivity("update_payment_status"), 
  updatePaymentStatus
);

export default router;
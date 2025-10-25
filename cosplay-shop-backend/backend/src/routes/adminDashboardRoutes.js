// Path: src/routes/adminDashboardRoutes.js

import express from "express";
import { authenticateAdmin } from "../middleware/isAdmin.js";
import {
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
  getRecentAlerts,
  getOrderStatusDistribution,
} from "../controllers/adminDashboardController.js";

const router = express.Router();

// Tất cả routes đều cần admin authentication
router.use(authenticateAdmin);

// GET /api/admin/dashboard/stats - Thống kê tổng quan
router.get("/stats", getDashboardStats);

// GET /api/admin/dashboard/revenue-chart - Biểu đồ doanh thu
router.get("/revenue-chart", getRevenueChart);

// GET /api/admin/dashboard/top-products - Sản phẩm bán chạy
router.get("/top-products", getTopProducts);

// GET /api/admin/dashboard/alerts - Cảnh báo gần đây
router.get("/alerts", getRecentAlerts);

// GET /api/admin/dashboard/order-distribution - Phân bố trạng thái đơn hàng
router.get("/order-distribution", getOrderStatusDistribution);

export default router;
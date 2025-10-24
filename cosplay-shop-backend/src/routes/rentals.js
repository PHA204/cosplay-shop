// src/routes/rentals.js
import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import {
  createRentalOrder,
  getUserRentalOrders,
  getRentalOrderById,
  cancelRentalOrder,
  checkProductAvailability,
  confirmReturn
} from "../controllers/rentalOrderController.js"

const router = express.Router()

// Public routes
router.get("/check-availability", asyncHandler(checkProductAvailability))

// Protected routes
router.post("/create", authenticateToken, asyncHandler(createRentalOrder))
router.get("/", authenticateToken, asyncHandler(getUserRentalOrders))
router.get("/:id", authenticateToken, asyncHandler(getRentalOrderById))
router.put("/:id/cancel", authenticateToken, asyncHandler(cancelRentalOrder))

// Admin routes (nên thêm middleware isAdmin)
router.put("/:id/confirm-return", authenticateToken, asyncHandler(confirmReturn))

export default router
import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { createOrder, getUserOrders, getOrderById } from "../controllers/orderController.js"

const router = express.Router()

router.post("/create", authenticateToken, asyncHandler(createOrder))
router.get("/", authenticateToken, asyncHandler(getUserOrders))
router.get("/:id", authenticateToken, asyncHandler(getOrderById))

export default router

// src/routes/cart.js
import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  getCartItems,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// Các route giỏ hàng
router.get("/", authenticateToken, asyncHandler(getCartItems));
router.post("/add", authenticateToken, asyncHandler(addToCart));
router.put("/:id", authenticateToken, asyncHandler(updateCartItem));
router.delete("/:id", authenticateToken, asyncHandler(removeCartItem));
router.delete("/", authenticateToken, asyncHandler(clearCart));

export default router;

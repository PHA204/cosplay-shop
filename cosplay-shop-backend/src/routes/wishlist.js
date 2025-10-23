import express from "express"
import { asyncHandler } from "../middleware/errorHandler.js"
import { authenticateToken } from "../middleware/auth.js"
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js"

const router = express.Router()

router.get("/", authenticateToken, asyncHandler(getWishlist))
router.post("/add", authenticateToken, asyncHandler(addToWishlist))
router.delete("/:product_id", authenticateToken, asyncHandler(removeFromWishlist))

export default router

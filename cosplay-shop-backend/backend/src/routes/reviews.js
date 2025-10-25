import express from "express"
import { asyncHandler } from "../middleware/errorHandler.js"
import { authenticateToken } from "../middleware/auth.js"
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js"

const router = express.Router()

router.get("/product/:product_id", asyncHandler(getProductReviews))
router.post("/", authenticateToken, asyncHandler(createReview))
router.put("/:id", authenticateToken, asyncHandler(updateReview))
router.delete("/:id", authenticateToken, asyncHandler(deleteReview))

export default router

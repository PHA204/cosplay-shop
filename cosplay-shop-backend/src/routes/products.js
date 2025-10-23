import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  getAllProducts,
  getProductById,
  getAllCategories,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", asyncHandler(getAllProducts));
router.get("/:id", asyncHandler(getProductById));
router.get("/categories/all", asyncHandler(getAllCategories));

export default router;

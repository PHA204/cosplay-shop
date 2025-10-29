// Path: backend/src/routes/uploadRoutes.js

import express from 'express';
import upload from '../middleware/upload.js';
import { authenticateAdmin } from '../middleware/isAdmin.js';
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages
} from '../controllers/uploadController.js';

const router = express.Router();

// Admin authentication required for all routes
router.use(authenticateAdmin);

// POST /api/upload/single - Upload single image
router.post('/single', upload.single('image'), uploadSingleImage);

// POST /api/upload/multiple - Upload multiple images (max 10)
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

// DELETE /api/upload/delete - Delete single image
router.delete('/delete', deleteImage);

// DELETE /api/upload/delete-multiple - Delete multiple images
router.delete('/delete-multiple', deleteMultipleImages);

export default router;
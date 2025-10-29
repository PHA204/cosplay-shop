// Path: backend/src/controllers/uploadController.js

import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

/**
 * Upload single image to Cloudinary
 */
export const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'cosplay-shop/products',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete temp file
    await unlinkAsync(req.file.path);

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.file?.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'cosplay-shop/products',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Delete temp file
      await unlinkAsync(file.path);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.json({
      images: uploadedImages,
      count: uploadedImages.length
    });
  } catch (error) {
    // Clean up temp files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await unlinkAsync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      }
    }
    
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    res.json({
      message: 'Image deleted successfully',
      result
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Delete failed',
      details: error.message 
    });
  }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteMultipleImages = async (req, res) => {
  try {
    const { public_ids } = req.body;

    if (!public_ids || !Array.isArray(public_ids) || public_ids.length === 0) {
      return res.status(400).json({ error: 'Public IDs array is required' });
    }

    const result = await cloudinary.api.delete_resources(public_ids);

    res.json({
      message: 'Images deleted successfully',
      result
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Delete failed',
      details: error.message 
    });
  }
};
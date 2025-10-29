// services/cloudinaryService.js
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

class CloudinaryService {
  // Upload một ảnh
  async uploadImage(filePath, folder = 'products') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Xóa file tạm sau khi upload
      await fs.unlink(filePath);

      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
      throw error;
    }
  }

  // Upload nhiều ảnh
  async uploadMultipleImages(files, folder = 'products') {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file.path, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw error;
    }
  }

  // Xóa ảnh
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều ảnh
  async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CloudinaryService();
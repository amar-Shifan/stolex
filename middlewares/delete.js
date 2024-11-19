const cloudinary = require('cloudinary').v2;
const env = require('../utils/env_var');

// Configure Cloudinary
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: 'products',
        use_filename: true,
        unique_filename: true,
      });
      return { url: result.secure_url, public_id: result.public_id };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  };
  
  const deleteFromCloudinary = async (imageUrl) => {
    try {
      const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
      const fullPublicId = `products/${publicId}`;
      const result = await cloudinary.uploader.destroy(fullPublicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  };

  
// Middleware to handle product image updates
const handleProductImages = async (req, res, next) => {
    try {
      const imagesToDelete = req.body.imagesToDelete || [];
      const existingImages = req.body.existingImages || [];
      const existingImagesArray = Array.isArray(existingImages) ? existingImages : [existingImages];
      const imagesToDeleteArray = Array.isArray(imagesToDelete) ? imagesToDelete : [imagesToDelete];
  
      // Filter kept images
      const keptImages = existingImagesArray.filter(img => !imagesToDeleteArray.includes(img));
  
      // Delete images from Cloudinary
      const deletePromises = imagesToDeleteArray.map(deleteFromCloudinary);
      await Promise.all(deletePromises);
  
      // Upload new images
      const uploadedImages = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadedImage = await uploadToCloudinary(file.path);
          uploadedImages.push(uploadedImage.url);
        }
      }
  
      // Combine kept and newly uploaded images
      req.processedImages = [...keptImages, ...uploadedImages];
  
      next();
    } catch (error) {
      console.error('Error processing images:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing images',
      });
    }
  };
  


module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
    handleProductImages
};

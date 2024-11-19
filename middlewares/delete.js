const cloudinary = require('cloudinary').v2;
const env = require('../utils/env_var');

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

// Utility function to delete a single image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
    try {
        const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0]; // For URL cases
        const result = await cloudinary.uploader.destroy(`products/${publicId}`);
        if (result.result === 'ok') {
            return true;
        } else {
            console.error(`Failed to delete image: ${imageUrl}`);
            return false;
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return false;
    }
};

// Middleware to delete multiple images
const deleteImagesMiddleware = async (req, res, next) => {
    try {
        // Get images to delete from request body or query
        const imagesToDelete = req.body.imagesToDelete || req.query.imagesToDelete;
        
        if (!imagesToDelete) {
            return next();
        }

        // Convert to array if single string
        const imageUrls = Array.isArray(imagesToDelete) ? imagesToDelete : [imagesToDelete];
        
        // Delete all images
        const deletePromises = imageUrls.map(url => deleteFromCloudinary(url));
        const results = await Promise.all(deletePromises);
        
        // Add results to request object for potential use in next middleware
        req.deletedImages = {
            success: results.filter(result => result === true).length,
            failed: results.filter(result => result === false).length
        };
        
        next();
    } catch (error) {
        console.error('Error in delete images middleware:', error);
        // Don't throw error, just log it and continue
        next();
    }
};

// Middleware to delete single image
const deleteSingleImageMiddleware = async (req, res, next) => {
    try {
        const imageUrl = req.body.imageToDelete || req.query.imageToDelete;
        
        if (!imageUrl) {
            return next();
        }

        const result = await deleteFromCloudinary(imageUrl);
        req.imageDeleted = result;
        
        next();
    } catch (error) {
        console.error('Error in delete single image middleware:', error);
        next();
    }
};

// Helper function to clean up old images when updating
const cleanupOldImages = async (oldImages, newImages) => {
    try {
        const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));
        const deletePromises = imagesToDelete.map(url => deleteFromCloudinary(url));
        await Promise.all(deletePromises);
        return true;
    } catch (error) {
        console.error('Error cleaning up old images:', error);
        return false;
    }
};

module.exports = {
    deleteFromCloudinary,
    deleteImagesMiddleware,
    deleteSingleImageMiddleware,
    cleanupOldImages
};
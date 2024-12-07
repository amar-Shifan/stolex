const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const env = require('../utils/env_var')

console.log(env.CLOUDINARY_API_KEY)
console.log(env.CLOUDINARY_API_SECRET)
console.log(env.CLOUDINARY_CLOUD_NAME)


cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'products',  // Cloudinary folder to store the images
    allowedFormats: ['jpg', 'jpeg', 'png','webp'],  // Only these formats are allowed
});

// Initialize multer with the Cloudinary storage
const upload = multer({ storage: storage });

module.exports = upload;
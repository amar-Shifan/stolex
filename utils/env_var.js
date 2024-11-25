const dotenv = require("dotenv");
dotenv.config();
const sessionSecret = require('crypto').randomBytes(64).toString('hex');

module.exports = {
    PORT : process.env.PORT,
    HOST : process.env.HOST,
    BASE_URL : process.env.BASE_URL,
    MONGO_URL : process.env.MONGO_URL,
    EMAIL_ID : process.env.EMAIL_ID,
    PASS_KEY : process.env.PASS_KEY,
    SECRET : sessionSecret,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET
}
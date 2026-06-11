const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

let storage;

try {
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: "uploads",
            allowed_formats: ["jpg", "png", "jpeg", "pdf", "gif", "webp"],
            resource_type: "auto"
        },
    });
} catch (err) {
    console.warn("multer-storage-cloudinary not installed. Run: npm install multer-storage-cloudinary");
    storage = multer.memoryStorage();
}

module.exports = {
    cloudinary,
    storage,
};
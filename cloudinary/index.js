// Library imports
const cloudinary = require("cloudinary").v2
const { CloudinaryStorage } = require("multer-storage-cloudinary")

// Configures the cloudinary storage
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

// Creates a storage object to be used to save images
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "ShoppingWebsite",
        allowedFormats: ["jpeg", "png", "jpg"]
    }
})

module.exports = {
    cloudinary,
    storage
}
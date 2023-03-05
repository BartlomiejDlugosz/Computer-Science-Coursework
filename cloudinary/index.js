// Library imports
// This stores the cloudinary library, used for handling images
const cloudinary = require("cloudinary").v2
// This stores the cloudinary storage responsible for uploading images to the cloud and saving them
const { CloudinaryStorage } = require("multer-storage-cloudinary")

// Configures the cloudinary storage
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

// This configures a new cloudinary storage object which will be responsible for uploading images
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "ShoppingWebsite",
        allowedFormats: ["jpeg", "png", "jpg"]
    }
})

// This exports the cloudinary and the storage objects
module.exports = {
    cloudinary,
    storage
}
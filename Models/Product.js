const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: String,
    images: [String],
    discount: {
        type: Boolean,
        default: false
    },
    discountedPrice: {
        type: Number,
        min: 0,
        default: 0
    },
    categories: [ObjectId],
    tags: [String]
})

module.exports = mongoose.model("Product", productSchema)
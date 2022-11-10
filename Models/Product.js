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
    categories: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Category"
    },
    tags: [String],
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
})

module.exports = mongoose.model("Product", productSchema)
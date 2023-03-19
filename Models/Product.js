// Library imports
// This stores the mongoose library, responsible for handling database requests
const mongoose = require("mongoose")

// Defines the schema for the product model
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
    briefDescription: String,
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
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    sales: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    views: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
})

// Exports the product model
module.exports = mongoose.model("Product", productSchema)
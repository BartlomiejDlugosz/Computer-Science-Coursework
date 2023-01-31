// Library imports
const mongoose = require("mongoose")
const Product = require("./Product")

// Defines the schema for the category model
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
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

categorySchema.pre("findByIdAndDelete", async function (next) {
    const products = await Product.updateMany({categories: this.id}, {$pull: {categories: this.id}})
    next()
})

// Exports the category model
module.exports = mongoose.model("Category", categorySchema)
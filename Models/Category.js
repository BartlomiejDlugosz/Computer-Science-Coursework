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

// Defines the middleware for deleting a category. This removes the category from all the products containing the category
categorySchema.pre("findOneAndDelete", async function (next) {
    // "this" refers to the query, not the category so we have to extract the category id from 
    // the query
    const categoryId = this.getFilter()._id
    await Product.updateMany({ categories: categoryId }, { $pull: { categories: categoryId } })
    next()
})

// Exports the category model
module.exports = mongoose.model("Category", categorySchema)
// Library imports
// This stores the mongoose library, responsible for handling database requests
const mongoose = require("mongoose")
// This imports the product model
const Product = require("./Product")

// Creates a new schema for the categorys, which defines the format of how the category object will be stored
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

// Defines the middleware for deleting a category. It's responsible for going through all the products and removing the category
// being deleted from their categories array
categorySchema.pre("findOneAndDelete", async function (next) {
    // "this" refers to the query, not the category so we have to extract the category id from the query
    const categoryId = this.getFilter()._id
    // Update all the products containing the category to remove the removed category
    await Product.updateMany({ categories: categoryId }, { $pull: { categories: categoryId } })
    // Go onto the next middleware or function
    next()
})

// Exports the category model
module.exports = mongoose.model("Category", categorySchema)
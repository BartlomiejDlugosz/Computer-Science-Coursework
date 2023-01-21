// Library imports
const mongoose = require("mongoose")

// Defines the schema for the category model
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String
})

// Exports the category model
module.exports = mongoose.model("Category", categorySchema)
// Library imports
// This stores the mongoose library, responsible for handling database requests
const mongoose = require("mongoose")

// Defines the schema for the order model
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    productIds: {
        type: [{
            id: {
                type: mongoose.Schema.Types.ObjectId,
                // The ref field is used so we can easily populate this field when retrieving this object at a later date
                ref: "Product",
                _id: false
            },
            qty: Number,
            // This prevents from a id field being automatically added on
            _id: false
        }],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    total: {
        type: Number,
        min: 0
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: {
            city: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            },
            line1: {
                type: String,
                required: true
            },
            line_2: {
                type: String
            },
            postal_code: {
                type: String,
                required: true,
                maxlength: 8
            },
            _id: false
        },
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        min: 1,
        max: 2,
        default: 1
    },
    trackingNumber: {
        type: String
    }
})

// Exports the order model
module.exports = mongoose.model("Order", orderSchema)
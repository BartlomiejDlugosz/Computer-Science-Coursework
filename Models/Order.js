const mongoose = require("mongoose")

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
                ref: "Product"
            },
            qty: Number
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
            }
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
    }
})

module.exports = mongoose.model("Order", orderSchema)
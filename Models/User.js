// Library imports
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const Order = require("./Order")

// Defines the schema for the user model
const userSchema = new mongoose.Schema({
    permLvl: {
        type: Number,
        required: true,
        min: 1,
        max: 3,
        default: 1
    },
    email: {
        type: String,
        required: true,
        // Has to match against the RegEx expression for an email
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email address!"],
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: [6, "Password has to be at least 6 characters long!"]
    },
    name: {
        type: String,
        required: true,
        maxLength: 20
    },
    phone: {
        type: String
    },
    address: String,
    cart: {
        type: [{
            id: {
                type: mongoose.Schema.Types.ObjectId
            },
            qty: {
                type: Number
            },
            _id: false
        }],
        ref: "Product"
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Order"
    }
})

// Pre save middleware that encrypts the password if it was modified
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

// Deletes any orders associated with the user after deleting
userSchema.post("remove", async function (doc) {
    if (doc) {
        await Order.deleteMany({ _id: { $in: doc.orders } })
    }
})

// If the email is not unique then handle it
// Uniqueness isn't a validator and has to be handled separately
userSchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000 && error.keyValue.email) {
        next(new Error("Email address was already taken, please choose a different one."));
    } else {
        next(error);
    }
});

// Exports the user model
module.exports = mongoose.model("User", userSchema)
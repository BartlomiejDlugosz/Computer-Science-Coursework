// Library imports
// This stores the mongoose library, responsible for handling database requests
const mongoose = require("mongoose")
// This stores the bcrypt library, responsible for encrypting passwords as well as authenicating them
const bcrypt = require("bcrypt")
// Imports the order model
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

// This middleware runs before the object is saved. It checks if the password was modified, and if it was
// then it encrypts it and sets the password to the new encrypted password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

// This middleware is run after the accoutn was deleted. It deletes any orders associated with the user
userSchema.post("remove", async function (doc) {
    if (doc) {
        await Order.deleteMany({ _id: { $in: doc.orders } })
    }
})

// This middleware is to handle the error if the email isn't unique. Uniqueness isn't a validator in mongoose
// and instead throws an error so this has to be handled seperatley
userSchema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000 && error.keyValue.email) {
        next(new Error("Email address was already taken, please choose a different one."));
    } else {
        next(error);
    }
});

// Exports the user model
module.exports = mongoose.model("User", userSchema)
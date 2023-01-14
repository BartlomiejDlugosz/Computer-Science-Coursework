const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

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
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Product"
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Order"
    }
})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

userSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000 && error.keyValue.email) {
        next(new Error('Email address was already taken, please choose a different one.'));
    } else {
        next(error);
    }
});

module.exports = mongoose.model("User", userSchema)
const express = require("express")
const Order = require("../Models/Order")
const router = express.Router()

const Product = require("../Models/Product")
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn, isStaff } = require("../utils/middleware")

router.get("/orders", isLoggedIn, catchAsync(async (req, res) => {
    const populatedUser = await Order.populate(req.user, { path: "orders" })
    res.render("user/orders", { user: populatedUser })
}))

router.get("/orders/:id", isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params
    const order = await Order.findById(id).populate("productIds.id")
    res.render("user/showOrder", { order })
}))

module.exports = router
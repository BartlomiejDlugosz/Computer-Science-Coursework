const express = require("express")
const router = express.Router()

const Order = require("../Models/Order")
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn, isStaff } = require("../utils/middleware")

router.use(isLoggedIn)
router.use(isStaff)

router.get("/all", catchAsync(async (req, res) => {
    const { status } = req.query
    let orders
    if (status) {
        orders = await Order.find({ status }).sort({ date: 1 })
    } else {
        orders = await Order.find({}).sort({ date: 1 })
    }

    res.render("manageorders/all", { orders })
}))

router.get("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const order = await Order.findById(id).populate("userId").populate("productIds.id")
    res.render("manageorders/order", { order })
}))

router.put("/updatestatus/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    const order = await Order.findById(id)
    order.status = status
    await order.save()
    req.flash("success", "Successfully updated order!")
    res.redirect(`/manageorders/${id}`)
}))

module.exports = router
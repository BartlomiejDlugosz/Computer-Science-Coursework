// Library imports
const express = require("express")
const router = express.Router()

// Function imports
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn, isStaff } = require("../utils/middleware")

// Model imports
const Order = require("../Models/Order")

// Uses the isLoggedIn and isStaff middleware on the other routes
// to prevent unauthorised access
router.use(isLoggedIn)
router.use(isStaff)

// Defines the route to view all the orders
router.get("/all", catchAsync(async (req, res) => {
    const { status } = req.query
    let orders
    // Checks if a status is provided in the query (e.g. not started or dispatched)
    if (status) {
        orders = await Order.find({ status }).sort({ date: 1 })
    } else {
        orders = await Order.find({}).sort({ date: 1 })
    }

    res.render("manageorders/all", { orders })
}))

// Defines the route to view a specific order
router.get("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    // Finds the order and populates the user and product info
    const order = await Order.findById(id).populate("userId productIds.id")
    res.render("manageorders/order", { order })
}))

// Defines the route to update the status of a order
router.put("/updatestatus/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    // Finds the order and updates it
    await Order.findByIdAndUpdate(id, { status })
    req.flash("success", "Successfully updated order!")
    res.redirect(`/manageorders/${id}`)
}))

module.exports = router
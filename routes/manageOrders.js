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
    const { status, userId } = req.query
    let orders
    const searchOptions = {}
    // Checks if a status is provided in the query (e.g. not started or dispatched)
    if (status) {
        searchOptions.status = status
    }
    // Allows filtering by user
    if (userId) {
        // Makes the return to menu button return to the user
        res.locals.returnUrl = `/manageusers/${userId}`
        searchOptions.userId = userId
    }
    orders = await Order.find(searchOptions).sort({ date: 1 })
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
    const { status, trackingNumber } = req.body
    // Finds the order and updates it
    await Order.findByIdAndUpdate(id, { status, trackingNumber })
    req.flash("success", "Successfully updated order!")
    res.redirect(`/manageorders/${id}`)
}))

module.exports = router
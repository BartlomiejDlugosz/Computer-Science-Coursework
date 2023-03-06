// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()

// Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")
// Imports the necessary middleware
const { isLoggedIn, isStaff } = require("../utils/middleware")

// Model imports
// Imports the Order model
const Order = require("../Models/Order")

// Uses this middleware on every route in this file.
// This ensures the user is logged in first
router.use(isLoggedIn)
// This then ensures the user has the staff permission level or higher to access these routes
router.use(isStaff)

// This is a quicksort algorithm to sort the orders in ascending date order (oldest to newest)
const quicksortOrders = (orders, start, end) => {
    if (start >= end) return orders
    let pivotValue = orders[start].date
    let lowMark = start + 1
    let highMark = end
    let finished = false


    while (!finished) {
        while (lowMark <= highMark && orders[lowMark].date <= pivotValue) lowMark += 1
        while (lowMark <= highMark && orders[highMark].date >= pivotValue) highMark -= 1

        if (lowMark < highMark) {
            temp = orders[lowMark]
            orders[lowMark] = orders[highMark]
            orders[highMark] = temp
        } else finished = true
    }
    temp = orders[start]
    orders[start] = orders[highMark]
    orders[highMark] = temp

    orders = quicksortOrders(orders, start, highMark - 1)
    orders = quicksortOrders(orders, highMark + 1, end)

    return orders
}

// Defines the route to view all the orders
router.get("/all", catchAsync(async (req, res) => {
    // Extracts the status and userid from the parameters incase the results have to be filtered
    const { status, userId, redirect = "/account" } = req.query
    let orders
    // This creates a search options object which can be passed through to filter the orders
    const searchOptions = {}
    // Checks if a status is provided in the query (e.g. not started or dispatched)
    if (status) {
        searchOptions.status = status
    }
    // Allows filtering by user
    if (userId) {
        // Makes the return to menu button return to the users profile
        res.locals.returnUrl = `/manageusers/${userId}`
        searchOptions.userId = userId
    }
    // Gets all the orders will the search options specified and sorts them by date, oldest to newest
    orders = await Order.find(searchOptions)
    // Sorts the orders into ascending date order (oldest to newest)
    orders = quicksortOrders(orders, 0, orders.length - 1)
    // Then renders the template with the orders and the redirect link
    res.render("manageorders/all", { orders, redirect })
}))

// Defines the route to view a specific order
router.get("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Finds the order and populates the user and product info
    const order = await Order.findById(id).populate("userId productIds.id")
    // Renders the template with the order
    res.render("manageorders/order", { order })
}))

// Defines the route to update the status of a order
router.put("/updatestatus/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Extracts the status and tracking number from the body
    const { status, trackingNumber } = req.body
    // Finds the order and updates its status and tracking number
    await Order.findByIdAndUpdate(id, { status, trackingNumber })
    // Flashes a success message and redirects the user back to the order
    req.flash("success", "Successfully updated order!")
    res.redirect(`/manageorders/${id}`)
}))

// Exports the router
module.exports = router
// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object from express which is used to split up routes into different files
const router = express.Router()

// Function imports
// Imports the errorhandling functions
const { catchAsync } = require("../utils/errorhandling")

// Defines the route for displaying the users current cart
router.get("/", catchAsync(async (req, res) => {
    // Populates the array of ids with the product information
    const cart = await req.cart.populateCart()
    // Populated cart info is sent to template
    res.render("cart", { cart })
}))

// Defines the route for adding a new item to the cart
router.get("/add/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Extracts the redirect link from query, or defaults to the home page if not provided
    const { redirect = "/" } = req.query
    const cart = req.cart
    try {
        // Attempts to add the item and stores the success message returned
        const val = await cart.addItem(req, id)
        // This success message is then flashed and the user is redirected to the redirect link
        req.flash("success", val.msg)
        return res.redirect(redirect)
    } catch (e) {
        // Flashes a error if anything goes wrong and redirects to the redirect link
        req.flash("error", e.msg)
        return res.redirect(redirect)
    }
}))

// Defines the route to add or remove existing items in the cart (+ and - buttons on cart page)
// op stands for operation, add or remove
router.get("/qty/:op/:id", catchAsync(async (req, res) => {
    // Extracts the id and the operator from the parameters
    const { id, op } = req.params
    // Extracts the redirect link from the query
    const { redirect = "/" } = req.query
    // Extracts the cart from the request
    const cart = req.cart
    try {
        // Attempts to modify the item and stores the success message
        const val = await cart.modifyItem(req, id, op)
        // Flashes the success message and redirects the user to the redirect link
        req.flash("success", val.msg)
        return res.redirect(redirect)
    } catch (e) {
        // Flashes an error if anything goes wrong and redirects to the redirect link
        req.flash("error", e.msg)
        return res.redirect(redirect)
    }

}))

// Defines the route to remove an item from the cart
router.get("/remove/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Extracts the redirect link from the query
    const { redirect = "/" } = req.query
    // Extracts the cart from request
    const cart = req.cart
    // Removes the item from the cart
    cart.removeItem(req, id)
    // Flashes a success message and redirects the user to the redirect link
    req.flash("success", "Successfully removed from cart!")
    res.redirect(redirect)
}))

// Exports the router object
module.exports = router
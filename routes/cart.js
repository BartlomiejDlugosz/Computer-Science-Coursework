// Library imports
const express = require("express")
const router = express.Router()

// Function imports
const { catchAsync } = require("../utils/errorhandling")
const { Cart } = require("../utils/cart")

// Model imports
const Product = require("../Models/Product")

// Defines the route for displaying the users current cart
router.get("/", catchAsync(async (req, res) => {
    // Populates the array of ids with the product information
    const cart = await req.cart.populateCart()
    // Populated cart info is sent to template
    res.render("cart", { cart })
}))

// Defines the route for adding a new item to the cart
router.get("/add/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    // Extracts the redirect link from query, or defaults to the home page if not provided
    const { redirect = "/" } = req.query
    const cart = req.cart
    try {
        // Attempts to add the item
        const val = await cart.addItem(req, id)
        req.flash("success", val.msg)
        return res.redirect(redirect)
    } catch (e) {
        // Flashes a error if anything goes wrong
        req.flash("error", e.msg)
        return res.redirect(redirect)
    }
}))

// Defines the route to add or remove existing items in the cart (+ and - buttons on cart page)
// op stands for operation, add or remove
router.get("/qty/:op/:id", catchAsync(async (req, res) => {
    const { id, op } = req.params
    const { redirect = "/" } = req.query
    const cart = req.cart
    try {
        // Attempts to modify the item
        const val = await cart.modifyItem(req, id, op)
        req.flash("success", val.msg)
        return res.redirect(redirect)
    } catch (e) {
        // Flashes an error if anything goes wrong
        req.flash("error", e.msg)
        return res.redirect(redirect)
    }

}))

// Defines the route to remove an item from the cart
router.get("/remove/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { redirect = "/" } = req.query
    const cart = req.cart
    // Removes the item from the cart
    cart.removeItem(req, id)
    req.flash("success", "Successfully removed from cart!")
    res.redirect(redirect)
}))

module.exports = router
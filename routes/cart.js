// Library imports
const express = require("express")
const router = express.Router()

// Function imports
const { catchAsync } = require("../utils/errorhandling")

// Model imports
const Product = require("../Models/Product")

// Defines the route for displaying the users current cart
router.get("/", catchAsync(async (req, res) => {
    let newArray = []
    const cart = req.user ? req.user.cart : req.session.cart
    // The cart is stored as an array of ids so it has to be populated
    for (let product of cart) {
        let found = await Product.findById(product.productId)
        newArray.push({ product: found, qty: product.qty })
    }
    // Populated cart info is sent to template
    res.render("cart", { cart: newArray })
}))

// Defines the route for adding a new item to the cart
router.get("/add/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    // Extracts the redirect link from query, or defaults to the home page if not provided
    const { redirect = "/" } = req.query
    const cart = req.user ? req.user.cart : req.session.cart
    const product = await Product.findById(id)
    // Checks if the product is a valid product
    if (product) {
        if (product.stock > 0) {
            let found = false
            // This finds the product in the cart and checks if the quantity is greater than the amount of stock
            for (let item of cart) {
                if (item.productId.toString() === product.id) {
                    if (item.qty >= product.stock) {
                        // Displays error and doesn't add to cart
                        req.flash("error", "You have too many of this product in your cart!")
                        return res.redirect(redirect)
                    }
                    item.qty += 1
                    found = true
                    break
                }
            }
            // The product doesn't already exist in the cart so is added
            if (!found) {
                cart.push({ productId: product.id, qty: 1 })
            }
            // Saves the cart to either the session or the user
            req.session.cart = cart
            if (req.user) {
                req.user.cart = cart
                await req.user.save()
            }
            req.flash("success", "Successfully added to cart!")
            return res.redirect(redirect)
        }
        req.flash("error", "This product is out of stock!")
        return res.redirect(redirect)
    }
    req.flash("error", "Product not found")
    res.redirect(redirect)
}))

// Defines the route to add or remove existing items in the cart (+ and - buttons on cart page)
// op stands for operation, add or remove
router.get("/qty/:op/:id", catchAsync(async (req, res) => {
    const { op, id } = req.params
    const { redirect = "/" } = req.query
    const product = await Product.findById(id)
    const cart = req.user ? req.user.cart : req.session.cart
    // Searches for the product in the cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].productId.toString() === id) {
            // Adds or removes 1 based on the operation
            cart[i].qty = op === "add" ? cart[i].qty + 1 : cart[i].qty - 1
            // If too many items are in the cart then the quantity is set to the stock
            if (cart[i].qty > product.stock) {
                cart[i].qty = product.stock
                req.flash("error", "You have too many of this product in your cart!")
            }
            // Removes the item if the quantity is less than 0
            if (cart[i].qty <= 0) {
                cart.splice(i, 1)
            }
            break
        }
    }
    // Saves the cart to the session or the user
    req.session.cart = cart
    if (req.user) {
        req.user.cart = cart
        await req.user.save()
    }
    res.redirect(redirect)
}))

// Defines the route to remove an item from the cart
router.get("/remove/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { redirect = "/" } = req.query
    const cart = req.user ? req.user.cart : req.session.cart
    // Searches for the item in the cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].productId.toString() === id) {
            // Removes the item
            cart.splice(i, 1)
            break
        }
    }
    // Saves the cart to the session or the user
    req.session.cart = cart
    if (req.user) {
        req.user.cart = cart
        await req.user.save()
    }
    res.redirect(redirect)
}))

module.exports = router
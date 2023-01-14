const express = require("express")
const router = express.Router()

const Product = require("../Models/Product")
const { catchAsync, ExpressError } = require("../utils/errorhandling")

router.get("/add/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { redirect = "/" } = req.query
    const cart = req.session.cart
    const product = await Product.findById(id)
    if (product) {
        if (product.stock > 0) {
            let found = false
            for (let item of cart) {
                if (item.id === product.id) {
                    if (item.qty >= product.stock) {
                        req.flash("error", "You have too many of this product in your cart!")
                        return res.redirect(redirect)
                    }
                    item.qty += 1
                    found = true
                    break
                }
            }
            if (!found) {
                cart.push({ id: product.id, qty: 1 })
            }
            req.session.cart = cart
            console.log(req.session.cart)
            req.flash("success", "Successfully added to cart!")
            return res.redirect(redirect)
        }
        req.flash("error", "This product is out of stock!")
        return res.redirect(redirect)
    }
    req.flash("error", "Product not found")
    res.redirect(redirect)
}))

// op stands for operation, add or remove
router.get("/qty/:op/:id", catchAsync(async (req, res) => {
    const { op, id } = req.params
    const { redirect = "/" } = req.query
    const product = await Product.findById(id)
    const cart = req.session.cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart[i].qty = op === "add" ? cart[i].qty + 1 : cart[i].qty - 1
            if (cart[i].qty > product.stock) {
                cart[i].qty = product.stock
                req.flash("error", "You have too many of this product in your cart!")
            }
            if (cart[i].qty <= 0) {
                cart.splice(i, 1)
            }
            break
        }
    }
    res.redirect(redirect)
}))

router.get("/remove/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { redirect = "/" } = req.query
    const cart = req.session.cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart.splice(i, 1)
            break
        }
    }
    res.redirect(redirect)
}))

module.exports = router
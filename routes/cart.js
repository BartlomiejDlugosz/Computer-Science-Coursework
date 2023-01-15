const express = require("express")
const router = express.Router()

const Product = require("../Models/Product")
const { catchAsync, ExpressError } = require("../utils/errorhandling")

router.get("/", catchAsync(async (req, res) => {
    let newArray = []
    const cart = req.user ? req.user.cart : req.session.cart
    for (let product of cart) {
        let found = await Product.findById(product.productId)
        newArray.push({ product: found, qty: product.qty })
    }
    res.render("cart", { cart: newArray })
}))

router.get("/add/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { redirect = "/" } = req.query
    const cart = req.user ? req.user.cart : req.session.cart
    const product = await Product.findById(id)
    if (product) {
        if (product.stock > 0) {
            let found = false
            for (let item of cart) {
                if (item.productId.toString() === product.id) {
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
                cart.push({ productId: product.id, qty: 1 })
            }
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

// op stands for operation, add or remove
router.get("/qty/:op/:id", catchAsync(async (req, res) => {
    const { op, id } = req.params
    const { redirect = "/" } = req.query
    const product = await Product.findById(id)
    const cart = req.user ? req.user.cart : req.session.cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].productId.toString() === id) {
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
    if (req.user) {
        req.user.cart = cart
        await req.user.save()
    }
    res.redirect(redirect)
}))

router.get("/remove/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { redirect = "/" } = req.query
    const cart = req.user ? req.user.cart : req.session.cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].productId.toString() === id) {
            cart.splice(i, 1)
            break
        }
    }
    if (req.user) {
        req.user.cart = cart
        await req.user.save()
    }
    res.redirect(redirect)
}))

module.exports = router
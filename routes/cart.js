const express = require("express")
const router = express.Router()

const Product = require("../Models/Product")
const { catchAsync, ExpressError } = require("../utils/errorhandling")

router.get("/add/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const cart = req.session.cart
    const product = await Product.findById(id)
    if (product) {
        let found = false
        for (let item of cart) {
            if (item.id === product.id) {
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
        res.redirect(req.session.lastPage)
    }
    else {
        req.flash("error", "Product not found")
        res.redirect(req.session.lastPage)
    }
}))

// op stands for operation, add or remove
router.get("/qty/:op/:id", catchAsync(async (req, res) => {
    const { op, id } = req.params
    const cart = req.session.cart
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart[i].qty = op === "add" ? cart[i].qty + 1 : cart[i].qty - 1
            if (cart[i].qty <= 0) {
                cart.splice(i, 1)
            }
            break
        }
    }
    res.redirect(req.session.lastPage)
}))

module.exports = router
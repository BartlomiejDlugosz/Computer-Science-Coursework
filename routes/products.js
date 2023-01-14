const express = require("express")
const router = express.Router()

const Product = require("../Models/Product")
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn, isStaff } = require("../utils/middleware")

router.get("/", catchAsync(async (req, res) => {
    const products = await Product.find({})
    res.render("products", { products, title: "All Products" })
}))

router.post("/", isLoggedIn, isStaff, catchAsync(async (req, res) => {
    const { name, price, description, images, discount, discountedPrice, categories, tags, stock } = req.body
    const newProduct = new Product({ name, price, description, images, discount, discountedPrice, categories, tags, stock })
    const saved = await newProduct.save()
    req.flash("success", "Successfully created product!")
    res.redirect("/manageproducts/all")
}))

router.patch("/:id", isLoggedIn, isStaff, catchAsync(async (req, res) => {
    const { id } = req.params
    const { name, price, description, images, discount, discountedPrice, categories, tags, stock } = req.body
    const product = await Product.findByIdAndUpdate(id, { name, price, description, images, discount, discountedPrice, categories, tags, stock }, { runValidators: true, new: true })
    req.flash("success", "Successfully updated product!")
    res.redirect("/manageproducts/all")
}))

router.delete("/:id", isLoggedIn, isStaff, catchAsync(async (req, res) => {
    const { id } = req.params
    const product = await Product.findByIdAndDelete(id)
    req.flash("success", "Successfully deleted product!")
    res.redirect("/manageproducts/all")
}))

module.exports = router
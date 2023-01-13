const express = require("express")
const router = express.Router()

const Product = require("../Models/Product")
const Category = require("../Models/Category")
const { catchAsync, ExpressError } = require("../utils/errorhandling")

router.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", { categories })
}))

router.post("/", catchAsync(async (req, res) => {
    const { name, description } = req.body
    const newCategory = new Category({ name, description })
    await newCategory.save()
    req.flash("success", "Successfully created category!")
    res.redirect("/categories")
}))

router.get("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const category = await Category.findById(id)
    const products = await Product.find({ categories: id })
    res.render("products", { products, title: `${category.name}` })
}))

module.exports = router
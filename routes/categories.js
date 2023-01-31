// Library imports
const express = require("express")
const router = express.Router()

//Function imports
const { catchAsync } = require("../utils/errorhandling")

// Model imports
const Product = require("../Models/Product")
const Category = require("../Models/Category")

// Defines the route to view all the categories
router.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", { categories })
}))

// Defines the route to view the products in that category
router.get("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const category = await Category.findById(id)
    const products = await Product.find({ categories: id })
    res.render("products", { products, title: `${category.name}` })
}))

module.exports = router
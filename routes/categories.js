// Library imports
const express = require("express")
const router = express.Router()

//Function imports
const { catchAsync } = require("../utils/errorhandling")
const { isLoggedIn, isStaff } = require("../utils/middleware")

// Model imports
const Product = require("../Models/Product")
const Category = require("../Models/Category")

// Defines the route to view all the categories
router.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", { categories })
}))

// Defines the route to create a new category
// Verifys the user is logged in, and a staff member
router.post("/", isLoggedIn, isStaff, catchAsync(async (req, res) => {
    const { name, description } = req.body
    // Creates a new category with the providied name and description
    const newCategory = new Category({ name, description })
    await newCategory.save()
    req.flash("success", "Successfully created category!")
    res.redirect("/categories")
}))

// Defines the route to view the products in that category
router.get("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const category = await Category.findById(id)
    const products = await Product.find({ categories: id })
    res.render("products", { products, title: `${category.name}` })
}))

module.exports = router
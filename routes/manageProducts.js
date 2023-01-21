// Library imports
const express = require("express")
const router = express.Router()

// Function imports
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn, isStaff } = require("../utils/middleware")

// Model imports
const Product = require("../Models/Product")
const Category = require("../Models/Category")

// Uses the isLoggedIn and isStaff middleware on the other routes
// to prevent unauthorised access
router.use(isLoggedIn)
router.use(isStaff)

// Defines the route to view all the products
router.get("/all", catchAsync(async (req, res) => {
    const products = await Product.find({})
    res.render("manageproducts/all", { products })
}))

// Defines the route to render a form to create a new product
router.get("/new", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    res.render("manageproducts/new", { categories })
}))

// Defines a route to render a form to edit the currently selected product
router.get("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const categories = await Category.find({})
    const product = await Product.findById(id).populate("categories")
    res.render("manageproducts/product", { product, categories })
}))

module.exports = router
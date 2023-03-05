// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()

// Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")
// Imports the necessary middleware
const { isLoggedIn, isStaff } = require("../utils/middleware")

// Model imports
// Imports the product model
const Product = require("../Models/Product")
// Imports the category model
const Category = require("../Models/Category")

// Uses this middleware on every route in this file.
// This ensures the user is logged in first
router.use(isLoggedIn)
// This then ensures the user has the staff permission level or higher to access these routes
router.use(isStaff)

// Defines the route to view all the products
router.get("/all", catchAsync(async (req, res) => {
    // Get all the products in the database
    const products = await Product.find({})
    // Render the template with the products
    res.render("manageproducts/all", { products })
}))

// Defines the route to render a form to create a new product
router.get("/new", catchAsync(async (req, res) => {
    // Gets all the categories from the database, this is to give the user the selection of categories to add to the product
    const categories = await Category.find({})
    // Renders the form to create a new product with the categories
    res.render("manageproducts/new", { categories })
}))

// Defines a route to render a form to edit the currently selected product
router.get("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Gets all the categories from the database, this is to give the user the selection of categories to add to the product
    const categories = await Category.find({})
    // Gets all the information about the specific product and populates the categories to include their name
    const product = await Product.findById(id).populate("categories")
    // Render the template with the product and categories
    res.render("manageproducts/product", { product, categories })
}))

// Export the router
module.exports = router
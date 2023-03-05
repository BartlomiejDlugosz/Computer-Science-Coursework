// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()

//Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")

// Model imports
// Imports the product model
const Product = require("../Models/Product")
// Imports the category model
const Category = require("../Models/Category")

// Defines the route to view all the categories
router.get("/", catchAsync(async (req, res) => {
    // Gets all the categories from the database
    const categories = await Category.find({})
    // Renders the template with the categories
    res.render("categories", { categories })
}))

// Defines the route to view the products in that category
router.get("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Finds the category in the database
    const category = await Category.findById(id)
    // Gets all the products with that category
    const products = await Product.find({ categories: id })
    // Renders the template with the given products
    res.render("products", { products, title: `${category.name}` })
}))

// Exports the router
module.exports = router
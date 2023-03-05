// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()

//Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")
// Imports the necessary middleware
const { isLoggedIn, isStaff, validateCategory } = require("../utils/middleware")

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

// This defines the route to view all the categories that can be edited
router.get("/all", catchAsync(async (req, res) => {
    // This retrieves all the categories
    const categories = await Category.find({})
    // This then renders the template with the provided categories
    res.render("managecategories/all", { categories })
}))

// This renders the form to submit a new category
router.get("/new", (req, res) => {
    res.render("managecategories/new")
})

// This renders the form to edit a specific category
router.get("/:id", catchAsync(async (req, res) => {
    // This extracts the id from the parameters
    const { id } = req.params
    // It then retrieves all the information relating to the category
    const category = await Category.findById(id)
    // This information is then passed onto the template to be rendered in the form
    res.render("managecategories/category", { category })
}))

// This defines the route the refresh the statistics of the category like sales and views.
// I've decided to approach it this way because products can be added and removed and it makes it difficult to keep track
// so it's easier to refresh it on demand to save computing resources as well as time editing and removing products
router.get("/refresh/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Gets all the products with this category
    const products = await Product.find({ categories: id })
    // Sets the views and sales to 0
    let views = 0
    let sales = 0
    // Goes through each product and adds their views and sales
    for (let product of products) {
        views += product.views
        sales += product.sales
    }
    // The category information is then updated and saved sort of like a cache
    await Category.findByIdAndUpdate(id, { views, sales })
    // The user is then redirected back to the edit page
    res.redirect(`/managecategories/${id}`)
}))

// Defines the route to create a new category
// The body is validated to ensure all the necessary information is required
router.post("/", validateCategory, catchAsync(async (req, res) => {
    // Extracts the category information from the body
    const { category } = req.body
    // Creates a new category with the providied name and description
    const newCategory = new Category(category)
    // Saves it
    await newCategory.save()
    // And flashes a success message and redirects the user back to all the categories
    req.flash("success", "Successfully created category!")
    res.redirect("/managecategories/all")
}))

//Defines route to edit a category
router.patch("/:id", validateCategory, catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Extracts the category information from the body
    const { category } = req.body
    // Updates the category by overwriting all the previous information
    await Category.findByIdAndUpdate(id, category)
    // Flashes a success message and redirects the user back to all the categories
    req.flash("success", "Successfully updated category")
    res.redirect("/managecategories/all")
}))

// Defines route to delete category
router.delete("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Finds the category and deletes it. The middleware takes care of removing the category from the products
    await Category.findByIdAndDelete(id)
    // Flashes a success message and redirects the user back to all the categories
    req.flash("success", "Successfully deleted category")
    res.redirect("/managecategories/all")
}))

// Exports the router
module.exports = router
// Library Imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()
// Contains the multer library responsible for handling image uploads
const multer = require("multer")

// Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")
// Imports the required middleware
const { isLoggedIn, isStaff, validateProduct } = require("../utils/middleware")
// Imports the storage object from the cloudinary file
const { storage } = require("../cloudinary")

// Initializes multer with the storage object, this will be responsible for handling image uploads
const upload = multer({ storage })

// Model imports
// Imports the product model
const Product = require("../Models/Product")

// Defines the route for showing all products
router.get("/", catchAsync(async (req, res) => {
    // Gets all the products from the database
    const products = await Product.find({})
    // Renders the template with the products
    res.render("products", { products, title: "All Products" })
}))

// Defines the route to show the information about a specific product
router.get("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Finds the product in the database
    const product = await Product.findById(id)
    // Increments the views on the product
    product.views += 1
    // Saves the product
    product.save()
    // Renders the view page with the product information
    res.render("viewProduct", { product })
}))

// Uses this middleware on every route in this file.
// This ensures the user is logged in first
router.use(isLoggedIn)
// This then ensures the user has the staff permission level or higher to access these routes
router.use(isStaff)

// Defines the route for adding a new product
// First uploads any images passed through in the body
// Validates the body to ensure the correct information is supplied
router.post("/", upload.array("images"), validateProduct, catchAsync(async (req, res) => {
    // Extracts the product information from the body
    const { product } = req.body
    // Creates a new product with the following information
    const newProduct = new Product(product)
    // If there are any images on the request then these are saved to the product
    if (req.files) newProduct.images = req.files.map(image => image.path)
    // Saves the product
    await newProduct.save()
    // Flashes a success message and redirects to all the products
    req.flash("success", "Successfully created product!")
    res.redirect("/manageproducts/all")
}))

// Defines the route for editing a product
// First all the images in the body are uploaded and then the body is validated
router.patch("/:id", upload.array("images"), validateProduct, catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Extracts the product information from the body
    const { product } = req.body
    // Finds the product and updates it
    // runValidators ensures all the validation checks are still run
    const p = await Product.findByIdAndUpdate(id, product, { runValidators: true })
    // This adds the images uploaded to the images on the product
    p.images.push(...req.files.map(image => image.path))
    // The product is then saved
    await p.save()
    // A success message is displayed and the user is redirected to all the products
    req.flash("success", "Successfully updated product!")
    res.redirect("/manageproducts/all")
}))

// Defines route for deleting a product
router.delete("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Finds the product and deletes it
    await Product.findByIdAndDelete(id)
    // A success message is flashed and the user is redirected to all the prodcuts
    req.flash("success", "Successfully deleted product!")
    res.redirect("/manageproducts/all")
}))

// The router is exported
module.exports = router
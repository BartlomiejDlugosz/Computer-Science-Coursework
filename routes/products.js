// Library Imports
const express = require("express")
const router = express.Router()

// Function imports
const { catchAsync } = require("../utils/errorhandling")
const { isLoggedIn, isStaff, validateProduct } = require("../utils/middleware")

// Model imports
const Product = require("../Models/Product")

// Defines the route for showing all products
router.get("/", catchAsync(async (req, res) => {
    const products = await Product.find({})
    res.render("products", { products, title: "All Products" })
}))

// Uses the isLoggedIn and isStaff middleware on the other routes
// to prevent unauthorised access
router.use(isLoggedIn)
router.use(isStaff)

// Defines the route for adding a new product
// Validates the body to ensure the correct information is supplied
router.post("/", validateProduct, catchAsync(async (req, res) => {
    const { product } = req.body
    // Creates a product and displays a success message
    const newProduct = new Product(product)
    await newProduct.save()
    req.flash("success", "Successfully created product!")
    res.redirect("/manageproducts/all")
}))

// Defines the route for editing a product
router.patch("/:id", validateProduct, catchAsync(async (req, res) => {
    const { id } = req.params
    const { product } = req.body
    // Finds the product and updates it
    // runValidators ensures all the validation checks are still run
    await Product.findByIdAndUpdate(id, product, { runValidators: true })
    req.flash("success", "Successfully updated product!")
    res.redirect("/manageproducts/all")
}))

// Defines route for deleting a product
router.delete("/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    // Deletes the product and displays a success message
    await Product.findByIdAndDelete(id)
    req.flash("success", "Successfully deleted product!")
    res.redirect("/manageproducts/all")
}))

module.exports = router
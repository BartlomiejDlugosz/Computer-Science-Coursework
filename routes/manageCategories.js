// Library imports
const express = require("express")
const router = express.Router()

//Function imports
const { catchAsync } = require("../utils/errorhandling")
const { isLoggedIn, isStaff, validateCategory } = require("../utils/middleware")

// Model imports
const Product = require("../Models/Product")
const Category = require("../Models/Category")

router.use(isLoggedIn)
router.use(isStaff)

router.get("/all", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    res.render("managecategories/all", {categories})
}))

router.get("/new", (req, res) => {
    res.render("managecategories/new")
})

router.get("/:id", catchAsync(async(req, res) => {
    const {id} = req.params
    const category = await Category.findById(id)
    res.render("managecategories/category", {category})
}))

// Defines the route to create a new category
// Verifys the user is logged in, and a staff member
router.post("/", validateCategory, catchAsync(async (req, res) => {
    const { category } = req.body
    // Creates a new category with the providied name and description
    const newCategory = new Category(category)
    await newCategory.save()
    req.flash("success", "Successfully created category!")
    res.redirect("/managecategories/all")
}))

//Defines route to edit a category
router.patch("/:id", validateCategory, catchAsync(async(req, res) => {
    const {id} = req.params
    const {category} = req.body
    await Category.findByIdAndUpdate(id, category)
    req.flash("success", "Successfully updated category")
    res.redirect("/managecategories/all")
}))

// Defines route to delete category
router.delete("/:id", catchAsync(async(req, res) => {
    const {id} = req.params
    await Category.findByIdAndDelete(id)
    req.flash("success", "Successfully deleted category")
    res.redirect("/managecategories/all")
}))

module.exports = router
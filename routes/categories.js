const express = require("express")
const router = express.Router()

const Product = require("../Models/Product")
const Category = require("../Models/Category")

router.get("/", async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", { categories })
})

router.post("/", async (req, res) => {
    const { name, description } = req.body
    const newCategory = new Category({ name, description })
    await newCategory.save()
    res.redirect("/categories")
})

router.get("/:id", async (req, res) => {
    const { id } = req.params
    const category = await Category.findById(id)
    const products = await Product.find({ categories: id })
    res.render("products", { products, title: `${category.name}` })
})

module.exports = router
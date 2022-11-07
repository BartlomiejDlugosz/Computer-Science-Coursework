const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const app = express()

const User = require("./Models/User")
const Order = require("./Models/Order")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

mongoose.connect("mongodb+srv://shopApp:Fy6OpjfLwaaEV79D@bookings.owfjo.mongodb.net/ShopApp")
.then(data => {
    console.log("Connected to mongo")
})
.catch(err => {
    console.log("An error has occured!")
    console.log(err)
})

const PORT = 3000


app.use("view engine", "ejs")
app.use("views", path.join(__dirname, "views"))
app.use(express.urlencoded({extended: true}))
app.use(express.json())


app.get("/", async (req, res) => {
    const products = await Product.find({})
    res.render("homePage", {products})
})

app.get("/menu", (req, res) => {
    res.render("menu")
})




app.get("/products", async (req, res) => {
    const products = await Product.find({})
    res.render("products", {products})
})

app.post("/products", async (req, res) => {
    const {name, price, description, images, discount, discountedPrice, categories, tags} = req.body
    const newProduct = new Product({name, price, description, images, discount, discountedPrice, categories, tags})
    await newProduct.save()
    res.redirect("/products")
})




app.get("/categories", async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", {categories})
})

app.post("/categories", async (req, res) => {
    const {name, description} = req.body
    const newCategory = new Category({name, description})
    await newCategory.save()
    res.redirect("/categories")
})




app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})
const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const methodOverride = require("method-override")
const app = express()

const User = require("./Models/User")
const Order = require("./Models/Order")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

mongoose.connect("MONGO_DB_LINK_REDACTED")
    .then(data => {
        console.log("Connected to mongo")
    })
    .catch(err => {
        console.log("An error has occured!")
        console.log(err)
    })

const PORT = 3000


app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride("_method"))


app.get("/", async (req, res) => {
    const products = await Product.find({})
    res.render("homePage", { products })
})

app.get("/menu", (req, res) => {
    res.render("menu")
})




app.get("/products", async (req, res) => {
    const products = await Product.find({})
    res.render("products", { products })
})

app.post("/products", async (req, res) => {
    const { name, price, description, images, discount, discountedPrice, categories, tags, stock } = req.body
    const newProduct = new Product({ name, price, description, images, discount, discountedPrice, categories, tags, stock })
    await newProduct.save()
    res.redirect("/manageproducts/all")
})

app.patch("/products/:id", async (req, res) => {
    const { id } = req.params
    const { name, price, description, images, discount, discountedPrice, categories, tags, stock } = req.body
    const product = await Product.findByIdAndUpdate(id, { name, price, description, images, discount, discountedPrice, categories, tags, stock }, { runValidators: true, new: true })
    console.log(product)
    res.redirect("/manageproducts/all")
})

app.delete("/products/:id", async (req, res) => {
    const { id } = req.params
    const product = await Product.findByIdAndDelete(id)
    res.redirect("/manageproducts/all")
})




app.get("/categories", async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", { categories })
})

app.post("/categories", async (req, res) => {
    const { name, description } = req.body
    const newCategory = new Category({ name, description })
    await newCategory.save()
    res.redirect("/categories")
})




app.get("/manageproducts/all", async (req, res) => {
    const products = await Product.find({})
    res.render("manageproducts/all", { products })
})

app.get("/manageproducts/new", async (req, res) => {
    const categories = await Category.find({})
    res.render("manageproducts/new", { categories })
})

app.get("/manageproducts/:id", async (req, res) => {
    const { id } = req.params
    const categories = await Category.find({})
    const product = await Product.findById(id)
    console.log(categories)
    res.render("manageproducts/product", { product, categories })
})




app.get("/manageorders/all", async (req, res) => {
    const orders = await Order.find({})
    res.render("manageorders/all", { orders })
})

app.get("/manageorders/:id", async (req, res) => {
    const { id } = req.params
    const order = await Order.findById(id)
    res.render("manageorders/order", { order })
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})